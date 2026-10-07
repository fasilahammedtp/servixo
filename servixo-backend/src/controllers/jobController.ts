import { Request, Response } from "express";
import { Types } from "mongoose";
import { Job } from "../models/Job";
import { Category } from "../models/Category";
import { Worker } from "../models/Worker";
import { User } from "../models/User";
import { Quotation } from "../models/Quotation";
import { asyncHandler } from "../middleware/asyncHandler";
import { Notification } from "../models/Notification";
import { getIO, sendRealtimeNotification } from "../config/socket";
import { sendJobCompletedEmail, sendPaymentConfirmedEmail, sendPaymentReminderEmail } from "../utils/email";

export const findNearbyWorkers = async (
  coordinates: [number, number],
  categoryId: string | Types.ObjectId,
  customerId?: string | Types.ObjectId
) => {
  const [lng, lat] = coordinates;

  const category = await Category.findById(categoryId);
  if (!category) {
    console.log(`Category not found for ID: ${categoryId}`);
    return [];
  }

  console.log(`Category name: ${category.name}, Type: ${typeof category.name}`);

  const skillRegex = new RegExp(`^${category.name}$`, "i");

  const matchStage: any = {
    verificationStatus: "verified",
    isAvailable: true,
    skills: { $in: [category.name, skillRegex] },
    $expr: { $lte: ["$distance", "$serviceRadiusKm"] }
  };

  if (customerId) {
    matchStage.user = { $ne: new Types.ObjectId(customerId.toString()) };
  }

  let matchedWorkers: any[] = [];
  if (lng !== 0 || lat !== 0) {
    try {
      matchedWorkers = await Worker.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [lng, lat]
            },
            distanceField: "distance",
            distanceMultiplier: 0.001, // convert meters to kilometers
            spherical: true
          }
        },
        {
          $match: matchStage
        },
        {
          $addFields: {
            // Rating dominates so unrated workers stay below anyone with reviews.
            // Completions still matter among rated workers (and among unrated).
            // 0 rating + 0 completions => score 0, sorted to the bottom.
            priorityScore: {
              $add: [
                {
                  $cond: [
                    { $gt: [{ $ifNull: ["$rating", 0] }, 0] },
                    10000,
                    0,
                  ],
                },
                { $multiply: [{ $ifNull: ["$rating", 0] }, 10] },
                { $multiply: [{ $ifNull: ["$completedJobsCount", 0] }, 2] },
              ],
            },
          },
        },
        {
          $sort: {
            priorityScore: -1,
            rating: -1,
            completedJobsCount: -1,
            experienceYears: -1,
          },
        },
      ]);
    } catch (err) {
      console.warn("[findNearbyWorkers] Geo aggregation failed:", err);
    }
  }

  const populatedWorkers = await Worker.populate(matchedWorkers, {
    path: "user",
    select: "name"
  });

  console.log(
    "[findNearbyWorkers] Sorted by priorityScore:",
    populatedWorkers.map((w: any) => ({
      id: w._id?.toString(),
      name: w.user?.name,
      rating: w.rating ?? 0,
      completedJobsCount: w.completedJobsCount ?? 0,
      priorityScore: w.priorityScore ?? 0,
    }))
  );

  if (customerId) {
    const custIdStr = customerId.toString();
    return populatedWorkers.filter((worker: any) => {
      const workerUserId =
        worker.user && typeof worker.user === "object" && "_id" in worker.user
          ? worker.user._id.toString()
          : worker.user?.toString();
      return workerUserId !== custIdStr;
    });
  }

  return populatedWorkers;
};

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const { category, description, images, location, address } = req.body as {
    category: string;
    description: string;
    images?: string[];
    location: { lat: number; lng: number };
    address?: string;
  };

  const categoryDoc = await Category.findOne({ name: category });
  if (!categoryDoc) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  const job = await Job.create({
    customer: req.user?.userId,
    category: categoryDoc._id,
    description,
    images: images || [],
    location: {
      type: "Point",
      coordinates: [location.lng, location.lat]
    },
    address,
    status: "pending"
  });

  const matchedWorkers = await findNearbyWorkers(
    job.location.coordinates,
    job.category,
    req.user?.userId
  );

  try {
    const io = getIO();
    console.log(`[Job Creation Socket] Job ${job._id} created. Found ${matchedWorkers.length} matched nearby worker(s).`);

    const jobDataForWorker = {
      _id: job._id,
      category: {
        _id: categoryDoc._id,
        name: categoryDoc.name
      },
      description: job.description,
      images: job.images,
      location: job.location,
      address: job.address,
      status: job.status,
      createdAt: job.createdAt
    };

    for (const matchedWorker of matchedWorkers) {
      let workerUserId: string | null = null;
      if (matchedWorker.user) {
        if (typeof matchedWorker.user === "object" && "_id" in matchedWorker.user) {
          workerUserId = (matchedWorker.user as any)._id.toString();
        } else {
          workerUserId = (matchedWorker.user as any).toString();
        }
      }

      if (workerUserId) {
        const room = `worker:${workerUserId}`;
        console.log(`[Job Creation Socket] Emitting 'new-job' to room: '${room}' (worker user ID: ${workerUserId}) for job: ${job._id}`);
        io.to(room).emit("new-job", jobDataForWorker);

        try {
          const notification = await Notification.create({
            recipient: workerUserId,
            type: "job_matched",
            message: `New ${categoryDoc.name} job request near you`,
            job: job._id,
          });

          sendRealtimeNotification(workerUserId, notification);
        } catch (notifErr) {
          console.error("[Job Creation Notification ERROR]:", notifErr);
        }
      } else {
        console.warn(`[Job Creation Socket] Could not determine user ID for matched worker:`, matchedWorker._id);
      }
    }
  } catch (socketErr) {
    console.error("[Job Creation Socket ERROR] Error emitting new job event:", socketErr);
  }

  res.status(201).json({ job, nearbyWorkersFound: matchedWorkers.length });
});

export const getMyJobs = asyncHandler(async (req: Request, res: Response) => {
  const jobs = await Job.find({ customer: req.user?.userId })
    .populate("category", "name")
    .populate({
      path: "worker",
      populate: {
        path: "user",
        select: "name profilePhoto"
      }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({ jobs });
});

export const getJobById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const job = await Job.findById(id)
    .populate("category", "name")
    .populate({
      path: "worker",
      populate: {
        path: "user",
        select: "name profilePhoto"
      }
    });

  if (!job) {
    res.status(404).json({ message: "Job not found" });
    return;
  }

  const userId = req.user?.userId;
  const isCustomer = job.customer?.toString() === userId;
  const workerObj = job.worker as any;
  const workerUserId = workerObj?.user?._id?.toString() || workerObj?.user?.toString();
  const isWorker = workerUserId === userId;

  if (!isCustomer && !isWorker) {
    res.status(403).json({ message: "You are not authorized to view this job" });
    return;
  }

  res.status(200).json({ job });
});

export const getNearbyJobs = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const worker = await Worker.findOne({ user: userId });
  if (!worker) {
    res.status(404).json({ message: "Worker profile not found" });
    return;
  }


  let categoryQuery: any = {};
  if (worker.skills && worker.skills.length > 0) {
    const regexSkills = worker.skills.map((s) => new RegExp(`^${s}$`, "i"));
    const categories = await Category.find({ name: { $in: regexSkills } });
    const categoryIds = categories.map((c) => c._id);
    categoryQuery = { category: { $in: categoryIds } };
  }

  const query: any = {
    status: "pending",
    ...categoryQuery,
  };

  if (userId) {
    query.customer = { $ne: new Types.ObjectId(userId) };
  }

  const hasWorkerCoords =
    worker.location &&
    worker.location.coordinates &&
    worker.location.coordinates.length === 2 &&
    (worker.location.coordinates[0] !== 0 || worker.location.coordinates[1] !== 0);

  let geoJobs: any[] = [];

  if (hasWorkerCoords && worker.location?.coordinates) {
    const [lng, lat] = worker.location.coordinates;
    const radiusInMeters = (worker.serviceRadiusKm || 100) * 1000;

    try {
      geoJobs = await Job.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: radiusInMeters,
          },
        },
      }).populate("category", "name icon");
    } catch (e) {
      console.warn("Geo query failed:", e);
    }
  }

  if (userId) {
    geoJobs = geoJobs.filter((j: any) => {
      const custId = j.customer?._id?.toString() || j.customer?.toString();
      return custId !== userId;
    });
  }

  res.status(200).json({ jobs: geoJobs });
});

export const getWorkerAssignedJobs = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const worker = await Worker.findOne({ user: userId });

  if (!worker) {
    res.status(404).json({ message: "Worker profile not found" });
    return;
  }

  const jobs = await Job.find({ worker: worker._id })
    .populate("category", "name icon")
    .populate("customer", "name email phone profilePhoto")
    .sort({ createdAt: -1 });

  res.status(200).json({ jobs });
});
export const getCustomerDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const customerObjectId = new Types.ObjectId(userId);

  const totalBookings = await Job.countDocuments({ customer: customerObjectId });
  const activeJobs = await Job.countDocuments({
    customer: customerObjectId,
    status: { $in: ["pending", "accepted", "in_progress", "on_the_way", "arrived", "working"] },
  });
  const completedJobs = await Job.countDocuments({
    customer: customerObjectId,
    status: "completed",
  });

  const totalSpentAgg = await Job.aggregate([
    {
      $match: {
        customer: customerObjectId,
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$finalPrice" },
      },
    },
  ]);

  const totalSpent = totalSpentAgg.length > 0 ? totalSpentAgg[0].total || 0 : 0;

  res.status(200).json({
    totalBookings,
    activeJobs,
    completedJobs,
    totalSpent,
  });
});

export const getWorkerDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const worker = await Worker.findOne({ user: userId });
  if (!worker) {
    res.status(404).json({ message: "Worker profile not found" });
    return;
  }

  const totalJobsCompleted = await Job.countDocuments({
    worker: worker._id,
    status: "completed",
  });

  const totalEarningsAgg = await Job.aggregate([
    {
      $match: {
        worker: worker._id,
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$finalPrice" },
      },
    },
  ]);

  const totalEarnings = totalEarningsAgg.length > 0 ? totalEarningsAgg[0].total || 0 : 0;
  const averageRating = worker.rating || 0;

  const totalQuotesSent = await Quotation.countDocuments({ worker: worker._id });
  const acceptedQuotes = await Quotation.countDocuments({
    worker: worker._id,
    status: "accepted",
  });

  const acceptanceRate =
    totalQuotesSent > 0 ? Math.round((acceptedQuotes / totalQuotesSent) * 100) : 0;

  res.status(200).json({
    totalJobsCompleted,
    totalEarnings,
    averageRating,
    totalQuotesSent,
    acceptanceRate,
  });
});

export const startJob = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const worker = await Worker.findOne({ user: userId });
  if (!worker) {
    res.status(404).json({ message: "Worker profile not found" });
    return;
  }

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404).json({ message: "Job not found" });
    return;
  }

  if (!job.worker || job.worker.toString() !== worker._id.toString()) {
    res.status(403).json({ message: "You are not authorized to start this job" });
    return;
  }

  if (job.status !== "accepted") {
    res.status(400).json({
      message: `Cannot start job with status '${job.status}'. Job must be 'accepted'.`,
    });
    return;
  }

  job.status = "in_progress";
  if (!job.startedAt) {
    job.startedAt = new Date();
  }
  await job.save();

  const notification = await Notification.create({
    recipient: job.customer,
    type: "job_started",
    message: "Your professional has started working on your job request.",
    job: job._id,
  });
  sendRealtimeNotification(job.customer.toString(), notification);

  res.status(200).json({ message: "Job marked as in progress", job });
});

export const completeJob = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const worker = await Worker.findOne({ user: userId }).populate("user", "name email");
  if (!worker) {
    res.status(404).json({ message: "Worker profile not found" });
    return;
  }

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404).json({ message: "Job not found" });
    return;
  }

  if (!job.worker || job.worker.toString() !== worker._id.toString()) {
    res.status(403).json({ message: "You are not authorized to complete this job" });
    return;
  }

  if (job.status !== "in_progress") {
    res.status(400).json({
      message: `Cannot complete job with status '${job.status}'. Job must be 'in_progress'.`,
    });
    return;
  }

  job.status = "completed";
  await job.save();

  worker.completedJobsCount = (worker.completedJobsCount || 0) + 1;
  await worker.save();

  const notification = await Notification.create({
    recipient: job.customer,
    type: "job_completed",
    message: "Job marked complete by worker! Please confirm your payment.",
    job: job._id,
  });
  sendRealtimeNotification(job.customer.toString(), notification);

  // Send email to customer 
  try {
    const customerUser = await User.findById(job.customer);
    const categoryDoc = await Category.findById(job.category);
    const customerEmail = customerUser?.email;
    const customerName = customerUser?.name || "Customer";
    const workerUser = worker.user as any;
    const workerName = workerUser?.name || "Service Professional";
    const categoryName = categoryDoc?.name || "Service";

    if (customerEmail) {
      await sendJobCompletedEmail({
        to: customerEmail,
        customerName,
        categoryName,
        workerName,
        finalPrice: job.finalPrice,
        jobDescription: job.description,
      });
      console.log(`[Job Completed Email SUCCESS] Email notification sent to customer: ${customerEmail}`);
    }
  } catch (emailErr) {
    console.error("[Job Completed Email ERROR]: Failed to send email to customer:", emailErr);
  }

  res.status(200).json({ message: "Job marked as completed", job });
});


export const markJobPaid = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404).json({ message: "Job not found" });
    return;
  }

  if (job.customer.toString() !== userId) {
    res.status(403).json({ message: "Only the job customer can confirm payment" });
    return;
  }

  if (job.status !== "completed") {
    res.status(400).json({ message: "Payment can only be confirmed for completed jobs" });
    return;
  }

  job.isPaid = true;
  await job.save();

  if (job.worker) {
    const worker = await Worker.findById(job.worker).populate("user", "name email");
    if (worker) {
      const notification = await Notification.create({
        recipient: worker.user,
        type: "payment_confirmed",
        message: "Payment confirmed by customer for your completed job!",
        job: job._id,
      });
      sendRealtimeNotification(worker.user.toString(), notification);

      // Send email to worker
      try {
        const customerUser = await User.findById(job.customer);
        const categoryDoc = await Category.findById(job.category);
        const workerUser = worker.user as any;
        const workerEmail = workerUser?.email;
        const workerName = workerUser?.name || "Service Professional";
        const customerName = customerUser?.name || "Customer";
        const categoryName = categoryDoc?.name || "Service";

        if (workerEmail) {
          await sendPaymentConfirmedEmail({
            to: workerEmail,
            workerName,
            customerName,
            categoryName,
            finalPrice: job.finalPrice,
            jobDescription: job.description,
          });
          console.log(`[Payment Confirmed Email SUCCESS] Email notification sent to worker: ${workerEmail}`);
        }
      } catch (emailErr) {
        console.error("[Payment Confirmed Email ERROR]: Failed to send email to worker:", emailErr);
      }
    }
  }

  res.status(200).json({ message: "Payment confirmed successfully", job });
});

export const reportPaymentIssue = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const worker = await Worker.findOne({ user: userId }).populate("user", "name email");
  if (!worker) {
    res.status(404).json({ message: "Worker profile not found" });
    return;
  }

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404).json({ message: "Job not found" });
    return;
  }

  if (!job.worker || job.worker.toString() !== worker._id.toString()) {
    res.status(403).json({ message: "You can only report a payment issue for your own assigned job" });
    return;
  }

  if (job.status !== "completed") {
    res.status(400).json({
      message: `Payment issues can only be reported for completed jobs. Current status is '${job.status}'.`,
    });
    return;
  }

  if (job.isPaid) {
    res.status(400).json({ message: "This job is already marked as paid" });
    return;
  }

  if (job.paymentIssueReported) {
    res.status(400).json({ message: "A payment issue has already been reported for this job" });
    return;
  }

  job.paymentIssueReported = true;
  job.paymentIssueReportedAt = new Date();
  await job.save();

  const categoryDoc = await Category.findById(job.category);
  const categoryName = categoryDoc?.name || "service";

  const notification = await Notification.create({
    recipient: job.customer,
    type: "payment_reminder",
    message: `Please confirm payment for your ${categoryName} job — your professional has flagged this as pending`,
    job: job._id,
  });
  sendRealtimeNotification(job.customer.toString(), notification);

  try {
    const customerUser = await User.findById(job.customer);
    const customerEmail = customerUser?.email;
    const customerName = customerUser?.name || "Customer";
    const workerUser = worker.user as any;
    const workerName = workerUser?.name || "Service Professional";

    if (customerEmail) {
      await sendPaymentReminderEmail({
        to: customerEmail,
        customerName,
        categoryName,
        workerName,
        finalPrice: job.finalPrice,
        jobDescription: job.description,
      });
      console.log(`[Payment Reminder Email SUCCESS] Email notification sent to customer: ${customerEmail}`);
    }
  } catch (emailErr) {
    console.error("[Payment Reminder Email ERROR]: Failed to send email to customer:", emailErr);
  }

  res.status(200).json({ message: "Payment issue reported. The customer has been notified.", job });
});



