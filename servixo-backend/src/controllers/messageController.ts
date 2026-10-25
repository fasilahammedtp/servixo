import { Request, Response } from "express";
import { Types } from "mongoose";
import rateLimit from "express-rate-limit";
import { Message } from "../models/Message";
import { Job } from "../models/Job";
import { Worker } from "../models/Worker";
import { User } from "../models/User";
import { Notification } from "../models/Notification";
import { asyncHandler } from "../middleware/asyncHandler";
import { emitToUser, sendRealtimeNotification } from "../config/socket";
import { getJobCategoryDisplay } from "../utils/jobUtils";

// Rate limit: 30 messages per minute per user using existing rate limiter pattern
export const messageRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req: Request) => req.user?.userId || "anonymous",
  message: { message: "Too many messages sent. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
});

type ChatContextSuccess = {
  job: InstanceType<typeof Job>;
  customerUserId: string;
  workerUserId: string;
  recipientId: string;
  isCustomer: boolean;
  isWorker: boolean;
};

type ChatContextError = {
  error: {
    status: number;
    message: string;
  };
};

async function getJobChatContext(
  jobId: string,
  currentUserId: string
): Promise<ChatContextSuccess | ChatContextError> {
  if (!Types.ObjectId.isValid(jobId)) {
    return { error: { status: 404, message: "Job not found" } };
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return { error: { status: 404, message: "Job not found" } };
  }

  if (!job.worker) {
    return {
      error: {
        status: 400,
        message: "No worker assigned to this job yet",
      },
    };
  }

  const workerDoc = await Worker.findById(job.worker).select("user");
  if (!workerDoc) {
    return {
      error: {
        status: 404,
        message: "Assigned worker profile not found",
      },
    };
  }

  const customerUserId = job.customer.toString();
  const workerUserId = workerDoc.user.toString();

  const isCustomer = currentUserId === customerUserId;
  const isWorker = currentUserId === workerUserId;

  if (!isCustomer && !isWorker) {
    return {
      error: {
        status: 403,
        message: "You are not a participant in this conversation",
      },
    };
  }

  const recipientId = isCustomer ? workerUserId : customerUserId;

  return {
    job,
    customerUserId,
    workerUserId,
    recipientId,
    isCustomer,
    isWorker,
  };
}

/**
 * POST /api/jobs/:jobId/messages
 * Create a new message, emit "new-message" to recipient room, return 201.
 */
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const currentUserId = req.user!.userId;

  const context = await getJobChatContext(jobId, currentUserId);
  if ("error" in context) {
    res.status(context.error.status).json({ message: context.error.message });
    return;
  }

  const { job, recipientId } = context;

  // Messaging allowed only when a worker is assigned and status is not "pending" and not "cancelled"
  if (job.status === "pending" || job.status === "cancelled") {
    res.status(400).json({
      message: `Messaging is not allowed when job status is ${job.status}`,
    });
    return;
  }

  const { text } = req.body;
  const trimmedText = typeof text === "string" ? text.trim() : "";
  if (!trimmedText || trimmedText.length < 1 || trimmedText.length > 1000) {
    res.status(400).json({
      message: "Message text is required and must be between 1 and 1000 characters",
    });
    return;
  }

  const message = await Message.create({
    job: job._id,
    sender: currentUserId,
    recipient: recipientId,
    text: trimmedText,
    readAt: null,
  });

  // Emit "new-message" to room user:<recipientId>
  emitToUser(recipientId, "new-message", message);

  // Messages -> bell: upsert one Notification of type "new_message" per (recipient, job)
  try {
    const senderUser = await User.findById(currentUserId).select("name");
    const senderName = senderUser?.name || "New message";
    const previewMessage = `${senderName}: ${trimmedText.length > 60 ? trimmedText.substring(0, 57) + "..." : trimmedText}`;

    let notification = await Notification.findOne({
      recipient: recipientId,
      job: job._id,
      type: "new_message",
      isRead: false,
    });

    if (notification) {
      notification.message = previewMessage;
      notification.createdAt = new Date();
      await notification.save();
    } else {
      notification = await Notification.create({
        recipient: recipientId,
        job: job._id,
        type: "new_message",
        message: previewMessage,
        isRead: false,
      });
    }

    sendRealtimeNotification(recipientId.toString(), notification);
  } catch (notifErr) {
    console.error("[Message Notification ERROR]:", notifErr);
  }

  res.status(201).json({ message });
});

/**
 * GET /api/jobs/:jobId/messages?before=<ISO>&limit=50
 * Newest page, returned oldest first, participants only.
 */
export const getJobMessages = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const currentUserId = req.user!.userId;

  const context = await getJobChatContext(jobId, currentUserId);
  if ("error" in context) {
    res.status(context.error.status).json({ message: context.error.message });
    return;
  }

  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 50, 1), 50);
  const query: Record<string, any> = { job: context.job._id };

  if (typeof req.query.before === "string") {
    const beforeDate = new Date(req.query.before);
    if (!isNaN(beforeDate.getTime())) {
      query.createdAt = { $lt: beforeDate };
    }
  }

  // Fetch newest page first
  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // Return chronologically oldest first
  messages.reverse();

  res.status(200).json({ messages });
});

/**
 * PATCH /api/jobs/:jobId/messages/read
 * Mark messages sent to me as read, emit "messages-read" { jobId } to the other participant.
 */
export const markJobMessagesAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const currentUserId = req.user!.userId;

  const context = await getJobChatContext(jobId, currentUserId);
  if ("error" in context) {
    res.status(context.error.status).json({ message: context.error.message });
    return;
  }

  const now = new Date();
  const updateResult = await Message.updateMany(
    {
      job: context.job._id,
      recipient: currentUserId,
      readAt: null,
    },
    {
      $set: { readAt: now },
    }
  );

  // Emit "messages-read" { jobId } to the other participant
  emitToUser(context.recipientId, "messages-read", {
    jobId: context.job._id.toString(),
  });

  // When recipient marks that conversation read, mark new_message notification read too
  try {
    await Notification.updateMany(
      {
        recipient: currentUserId,
        job: context.job._id,
        type: "new_message",
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );
  } catch (notifErr) {
    console.error("[Mark Messages Notification Read ERROR]:", notifErr);
  }

  res.status(200).json({
    message: "Messages marked as read",
    modifiedCount: updateResult.modifiedCount,
  });
});

/**
 * GET /api/messages/conversations
 * Every job the logged-in user takes part in that has at least one message.
 * Single aggregation pipeline with no per-row loops.
 */
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = req.user!.userId;
  if (!Types.ObjectId.isValid(currentUserId)) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }
  const userObjectId = new Types.ObjectId(currentUserId);

  const conversationsAgg = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: userObjectId }, { recipient: userObjectId }],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: "$job",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$recipient", userObjectId] },
                  { $eq: ["$readAt", null] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "jobs",
        localField: "_id",
        foreignField: "_id",
        as: "jobDoc",
      },
    },
    {
      $unwind: "$jobDoc",
    },
    {
      $lookup: {
        from: "categories",
        localField: "jobDoc.category",
        foreignField: "_id",
        as: "categoryDoc",
      },
    },
    {
      $unwind: {
        path: "$categoryDoc",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "workers",
        localField: "jobDoc.worker",
        foreignField: "_id",
        as: "workerDoc",
      },
    },
    {
      $unwind: {
        path: "$workerDoc",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        otherUserId: {
          $cond: [
            { $eq: ["$jobDoc.customer", userObjectId] },
            "$workerDoc.user",
            "$jobDoc.customer",
          ],
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "otherUserId",
        foreignField: "_id",
        as: "otherUserDoc",
      },
    },
    {
      $unwind: {
        path: "$otherUserDoc",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: { "lastMessage.createdAt": -1 },
    },
  ]);

  const conversations = conversationsAgg.map((item) => {
    const categoryDisplay = getJobCategoryDisplay({
      category: item.categoryDoc?.name,
      customTitle: item.jobDoc?.customTitle,
    });

    return {
      jobId: item._id.toString(),
      category: categoryDisplay,
      otherParty: {
        _id: item.otherUserDoc?._id?.toString(),
        name: item.otherUserDoc?.name || "User",
        profilePhoto: item.otherUserDoc?.profilePhoto,
      },
      otherPartyName: item.otherUserDoc?.name || "User",
      otherPartyProfilePhoto: item.otherUserDoc?.profilePhoto,
      lastMessage: {
        text: item.lastMessage.text,
        time: item.lastMessage.createdAt,
      },
      lastMessageText: item.lastMessage.text,
      lastMessageTime: item.lastMessage.createdAt,
      unreadCount: item.unreadCount,
    };
  });

  // Also include active/hired jobs that have no messages yet so users can initiate chat directly from the list
  const workerDoc = await Worker.findOne({ user: userObjectId }).select("_id").lean();
  const workerId = workerDoc?._id;

  const existingJobIds = conversationsAgg.map((item) => item._id);
  const activeJobQuery: Record<string, any> = {
    _id: { $nin: existingJobIds },
    worker: { $ne: null },
    status: { $in: ["accepted", "in_progress", "completed"] },
    $or: [{ customer: userObjectId }],
  };
  if (workerId) {
    activeJobQuery.$or.push({ worker: workerId });
  }

  const unmessagedJobs = await Job.find(activeJobQuery)
    .populate("category", "name")
    .populate("customer", "name profilePhoto")
    .populate({
      path: "worker",
      select: "user",
      populate: { path: "user", select: "name profilePhoto" },
    })
    .sort({ updatedAt: -1 })
    .lean();

  for (const job of unmessagedJobs) {
    const isCustomer = job.customer && (job.customer as any)._id?.toString() === currentUserId;
    const otherUser = isCustomer ? (job.worker as any)?.user : (job.customer as any);

    const timeVal = job.updatedAt || job.createdAt || new Date();
    const timeIso = timeVal instanceof Date ? timeVal.toISOString() : new Date(timeVal).toISOString();

    conversations.push({
      jobId: job._id.toString(),
      category: getJobCategoryDisplay({
        category: (job.category as any)?.name,
        customTitle: job.customTitle,
      }),
      otherParty: {
        _id: otherUser?._id?.toString(),
        name: otherUser?.name || "User",
        profilePhoto: otherUser?.profilePhoto,
      },
      otherPartyName: otherUser?.name || "User",
      otherPartyProfilePhoto: otherUser?.profilePhoto,
      lastMessage: {
        text: "",
        time: timeIso,
      },
      lastMessageText: "",
      lastMessageTime: timeIso,
      unreadCount: 0,
    });
  }

  res.status(200).json({ conversations });
});

/**
 * GET /api/messages/unread-count
 * Returns total unread count across all conversations for logged-in user.
 */
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = req.user!.userId;
  const count = await Message.countDocuments({
    recipient: currentUserId,
    readAt: null,
  });
  res.status(200).json({ count });
});
