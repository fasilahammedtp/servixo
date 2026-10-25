import { Request, Response } from "express";
import { Types } from "mongoose";
import { Worker } from "../models/Worker";
import { User } from "../models/User";
import { Job } from "../models/Job";
import { Category } from "../models/Category";
import { Quotation } from "../models/Quotation";
import { Review } from "../models/Review";
import { Notification } from "../models/Notification";
import { sendRealtimeNotification, getIO } from "../config/socket";
import { sendWorkerVerificationEmail } from "../utils/email";
import { getJobCategoryDisplay } from "../utils/jobUtils";
import { asyncHandler } from "../middleware/asyncHandler";

export const getPendingWorkers = asyncHandler(async (req: Request, res: Response) => {
  const verifiedUserIds = await User.find({ isEmailVerified: true }).distinct("_id");
  const workers = await Worker.find({
    verificationStatus: "pending",
    user: { $in: verifiedUserIds },
  }).populate("user", "name email");
  res.status(200).json({ workers });
});

async function notifyWorkerVerification(worker: any, status: "verified" | "rejected") {
  const workerUser = worker.user as any;
  const recipientId = workerUser?._id || worker.user;
  const isVerified = status === "verified";

  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type: isVerified ? "worker_verified" : "worker_rejected",
      message: isVerified
        ? "Congratulations! Your worker profile has been approved. You can now accept service requests."
        : "Your worker application was rejected by the administration team. Please reach out to support for more information.",
    });

    sendRealtimeNotification(recipientId.toString(), notification);
  } catch (err) {
    console.error("Failed to create worker verification notification:", err);
  }

  try {
    if (workerUser?.email) {
      await sendWorkerVerificationEmail({
        to: workerUser.email,
        workerName: workerUser.name || "Service Professional",
        status,
      });
    }
  } catch (emailErr) {
    console.warn("Could not send worker verification email:", emailErr);
  }
}

export const updateWorkerVerification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };

  if (status !== "verified" && status !== "rejected") {
    res.status(400).json({ message: "Invalid status. Must be 'verified' or 'rejected'." });
    return;
  }

  const worker = await Worker.findOneAndUpdate(
    { user: id },
    { $set: { verificationStatus: status } },
    { new: true }
  ).populate("user", "name email");

  if (!worker) {
    res.status(404).json({ message: "Worker not found for this user id" });
    return;
  }

  await notifyWorkerVerification(worker, status);

  res.status(200).json({ worker });
});

async function setWorkerVerificationStatus(
  workerId: string,
  status: "verified" | "rejected",
  res: Response
) {
  const worker = await Worker.findByIdAndUpdate(
    workerId,
    { $set: { verificationStatus: status } },
    { new: true }
  ).populate("user", "name email");

  if (!worker) {
    res.status(404).json({ message: "Worker not found" });
    return;
  }

  await notifyWorkerVerification(worker, status);

  res.status(200).json({ worker });
}

export const verifyWorker = asyncHandler(async (req: Request, res: Response) => {
  await setWorkerVerificationStatus(req.params.workerId, "verified", res);
});

export const rejectWorker = asyncHandler(async (req: Request, res: Response) => {
  await setWorkerVerificationStatus(req.params.workerId, "rejected", res);
});

export const getPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalCustomers, totalWorkers, jobStatusCounts, revenueResult] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ $or: [{ role: "customer" }, { hasCustomerProfile: true }] }),
    Worker.countDocuments(),
    Job.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Job.aggregate<{ _id: null; total: number }>([
      { $match: { status: "completed", isPaid: true } },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } },
    ]),
  ]);

  const jobsByStatus = {
    pending: 0,
    accepted: 0,
    in_progress: 0,
    completed: 0,
  };

  for (const row of jobStatusCounts) {
    if (row._id === "pending" || row._id === "accepted" || row._id === "in_progress" || row._id === "completed") {
      jobsByStatus[row._id] = row.count;
    }
  }

  const completedPaidTotal = revenueResult[0]?.total ?? 0;
  const totalPlatformRevenue = Math.round(completedPaidTotal * 0.15 * 100) / 100;

  res.status(200).json({
    totalUsers,
    totalCustomers,
    totalWorkers,
    jobsByStatus,
    totalCompletedJobs: jobsByStatus.completed,
    totalPlatformRevenue,
  });
});

export const getPaymentIssues = asyncHandler(async (_req: Request, res: Response) => {
  const jobs = await Job.find({ paymentIssueReported: true, isPaid: false })
    .populate("customer", "name email")
    .populate({
      path: "worker",
      populate: { path: "user", select: "name email" },
    })
    .populate("category", "name")
    .select("customer worker category customTitle description finalPrice paymentIssueReported paymentIssueReportedAt isPaid")
    .sort({ paymentIssueReportedAt: -1 });

  res.status(200).json({ jobs });
});

export const getAdminUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, search } = req.query as { role?: string; search?: string };
  const query: any = {};

  if (role && role !== "all") {
    query.role = role;
  }

  if (search && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedSearch, "i");
    query.$or = [{ name: regex }, { email: regex }];
  }

  const users = await User.find(query)
    .select("name email role isBlocked createdAt")
    .sort({ createdAt: -1 });

  res.status(200).json({ users });
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (req.user?.userId === userId) {
    res.status(400).json({ message: "You cannot block your own admin account." });
    return;
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  if (targetUser.role === "admin") {
    res.status(400).json({ message: "Admin accounts cannot be blocked." });
    return;
  }

  targetUser.isBlocked = true;
  await targetUser.save();

  try {
    const io = getIO();
    io.in(`user:${userId}`).disconnectSockets(true);
  } catch (socketErr) {
    console.warn("Failed to disconnect sockets for blocked user:", socketErr);
  }

  res.status(200).json({
    message: "User blocked successfully",
    user: {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      isBlocked: targetUser.isBlocked,
      createdAt: targetUser.createdAt,
    },
  });
});

export const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  targetUser.isBlocked = false;
  await targetUser.save();

  res.status(200).json({
    message: "User unblocked successfully",
    user: {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      isBlocked: targetUser.isBlocked,
      createdAt: targetUser.createdAt,
    },
  });
});

export const getUserDetails = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!Types.ObjectId.isValid(userId)) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const userDoc = await User.findById(userId).select(
    "name email phone role isBlocked isEmailVerified createdAt profilePhoto"
  );

  if (!userDoc) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const userObjectId = userDoc._id;

  //checking if the user has profile in worker collcetion
  const workerDoc = await Worker.findOne({ user: userObjectId });

  const allStatuses = [
    "pending",
    "accepted",
    "in_progress",
    "on_the_way",
    "arrived",
    "working",
    "completed",
    "cancelled",
  ] as const;

  const customerJobAggPromise = Job.aggregate([
    { $match: { customer: userObjectId } },
    {
      $facet: {
        totalJobs: [{ $count: "count" }],
        statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        totalSpent: [
          { $match: { status: "completed", isPaid: true } },
          { $group: { _id: null, total: { $sum: "$finalPrice" } } },
        ],
        unpaidCompleted: [
          { $match: { status: "completed", isPaid: false } },
          { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$finalPrice" } } },
        ],
      },
    },
  ]);

  const reviewsGivenPromise = Review.countDocuments({ customer: userObjectId });

  const workerJobAggPromise = workerDoc
    ? Job.aggregate([
      { $match: { worker: workerDoc._id } },
      {
        $facet: {
          statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          jobsHired: [
            { $match: { status: { $ne: "pending" } } },
            { $count: "count" },
          ],
          completedPaid: [
            { $match: { status: "completed", isPaid: true } },
            { $group: { _id: null, total: { $sum: "$finalPrice" } } },
          ],
          completedUnpaid: [
            { $match: { status: "completed", isPaid: false } },
            { $group: { _id: null, total: { $sum: "$finalPrice" } } },
          ],
          paymentIssues: [
            { $match: { paymentIssueReported: true } },
            { $count: "count" },
          ],
        },
      },
    ])
    : Promise.resolve(null);

  const quotationAggPromise = workerDoc
    ? Quotation.aggregate([
      { $match: { worker: workerDoc._id } },
      {
        $group: {
          _id: null,
          quotesSent: { $sum: 1 },
          quotesAccepted: {
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
          },
        },
      },
    ])
    : Promise.resolve(null);

  const workerReviewAggPromise = workerDoc
    ? Review.aggregate([
      { $match: { worker: workerDoc._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ])
    : Promise.resolve(null);

  const jobFilter = workerDoc
    ? { $or: [{ customer: userObjectId }, { worker: workerDoc._id }] }
    : { customer: userObjectId };

  const recentJobsPromise = Job.find(jobFilter)
    .populate("customer", "name")
    .populate({
      path: "worker",
      populate: { path: "user", select: "name" },
    })
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .limit(10);

  const recentReviewsPromise = workerDoc
    ? Review.find({ worker: workerDoc._id })
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .limit(5)
    : Promise.resolve([]);

  const [
    customerJobAgg,
    reviewsGiven,
    workerJobAgg,
    quotationAgg,
    workerReviewAgg,
    recentJobsDocs,
    recentReviewsDocs,
  ] = await Promise.all([
    customerJobAggPromise,
    reviewsGivenPromise,
    workerJobAggPromise,
    quotationAggPromise,
    workerReviewAggPromise,
    recentJobsPromise,
    recentReviewsPromise,
  ]);

  // Customer section: Include for every user who has posted jobs, even if role is "worker", or role is "customer"
  const totalJobsPosted = customerJobAgg[0]?.totalJobs[0]?.count ?? 0;
  let customerData = null;

  if (totalJobsPosted > 0 || userDoc.role === "customer") {
    const customerCountsByStatus: Record<string, number> = {};
    for (const s of allStatuses) {
      customerCountsByStatus[s] = 0;
    }
    if (customerJobAgg[0]?.statusCounts) {
      for (const row of customerJobAgg[0].statusCounts) {
        if (row._id && row._id in customerCountsByStatus) {
          customerCountsByStatus[row._id] = row.count;
        }
      }
    }

    const totalSpent = customerJobAgg[0]?.totalSpent[0]?.total ?? 0;
    const unpaidCompletedCount = customerJobAgg[0]?.unpaidCompleted[0]?.count ?? 0;
    const unpaidCompletedAmount = customerJobAgg[0]?.unpaidCompleted[0]?.amount ?? 0;

    customerData = {
      totalJobsPosted,
      countsByStatus: customerCountsByStatus,
      totalSpent,
      unpaidCompleted: {
        count: unpaidCompletedCount,
        amount: unpaidCompletedAmount,
      },
      reviewsGiven,
    };
  }


  let workerData = null;
  if (workerDoc && workerJobAgg) {
    const workerCountsByStatus: Record<string, number> = {};
    for (const s of allStatuses) {
      workerCountsByStatus[s] = 0;
    }
    if (workerJobAgg[0]?.statusCounts) {
      for (const row of workerJobAgg[0].statusCounts) {
        if (row._id && row._id in workerCountsByStatus) {
          workerCountsByStatus[row._id] = row.count;
        }
      }
    }

    const jobsHired = workerJobAgg[0]?.jobsHired[0]?.count ?? 0;
    const completedJobs = workerCountsByStatus.completed ?? 0;
    const totalEarnings = workerJobAgg[0]?.completedPaid[0]?.total ?? 0;
    const pendingPayout = workerJobAgg[0]?.completedUnpaid[0]?.total ?? 0;
    const commissionGenerated = Math.round(totalEarnings * 0.15 * 100) / 100;

    const quotesSent = quotationAgg?.[0]?.quotesSent ?? 0;
    const quotesAccepted = quotationAgg?.[0]?.quotesAccepted ?? 0;
    const acceptanceRate = quotesSent > 0 ? Math.round((quotesAccepted / quotesSent) * 100) : 0;

    const totalReviews = workerReviewAgg?.[0]?.totalReviews ?? 0;
    const avgRating = workerReviewAgg?.[0]?.avgRating
      ? Math.round(workerReviewAgg[0].avgRating * 10) / 10
      : 0;

    const paymentIssuesReported = workerJobAgg[0]?.paymentIssues[0]?.count ?? 0;

    workerData = {
      verificationStatus: workerDoc.verificationStatus,
      isAvailable: workerDoc.isAvailable,
      skills: workerDoc.skills || [],
      serviceRadiusKm: workerDoc.serviceRadiusKm ?? 5,
      experienceYears: workerDoc.experienceYears ?? 0,
      visitingCharge: workerDoc.visitingCharge ?? 0,
      jobsHired,
      countsByStatus: workerCountsByStatus,
      completedJobs,
      totalEarnings,
      pendingPayout,
      commissionGenerated,
      quotesSent,
      quotesAccepted,
      acceptanceRate,
      averageRating: avgRating,
      totalReviews,
      paymentIssuesReported,
    };
  }

  // Format recent 10 jobs (as customer and as worker)
  const recentJobs = (recentJobsDocs || []).map((j: any) => {
    const isCustomer = j.customer?._id?.toString() === userObjectId.toString();
    const otherPartyName = isCustomer
      ? (j.worker?.user?.name || (j.worker ? "Assigned Worker" : "Unassigned"))
      : (j.customer?.name || "Customer");

    return {
      _id: j._id,
      category: getJobCategoryDisplay(j),
      status: j.status,
      price: j.finalPrice,
      createdAt: j.createdAt,
      otherPartyName,
      role: isCustomer ? ("customer" as const) : ("worker" as const),
    };
  });

  // Format recent 5 reviews received
  const recentReviews = (recentReviewsDocs || []).map((r: any) => ({
    _id: r._id,
    rating: r.rating,
    comment: r.comment || "",
    customerName: r.customer?.name || "Customer",
    createdAt: r.createdAt,
  }));

  res.status(200).json({
    user: {
      _id: userDoc._id,
      name: userDoc.name,
      email: userDoc.email,
      phone: userDoc.phone,
      role: userDoc.role,
      isBlocked: userDoc.isBlocked,
      isEmailVerified: userDoc.isEmailVerified,
      createdAt: userDoc.createdAt,
      profilePhoto: userDoc.profilePhoto,
    },
    customer: customerData,
    worker: workerData,
    recentJobs,
    recentReviews,
  });
});

export const getAdminCategories = asyncHandler(async (_req: Request, res: Response) => {
  const [categories, jobCounts, workerCounts] = await Promise.all([
    Category.find().sort({ name: 1 }),
    Job.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    Worker.aggregate<{ _id: string; count: number }>([
      { $unwind: "$skills" },
      { $group: { _id: { $toLower: "$skills" }, count: { $sum: 1 } } },
    ]),
  ]);

  const jobCountMap = new Map(jobCounts.map((j) => [j._id?.toString(), j.count]));
  const workerCountMap = new Map(workerCounts.map((w) => [w._id?.toLowerCase(), w.count]));

  const result = categories.map((cat) => ({
    _id: cat._id,
    name: cat.name,
    icon: cat.icon || "Briefcase",
    description: cat.description || "",
    isActive: cat.isActive !== false,
    image: cat.image || "",
    jobCount: jobCountMap.get(cat._id.toString()) || 0,
    workerCount: workerCountMap.get(cat.name.trim().toLowerCase()) || 0,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  }));

  res.status(200).json({ categories: result });
});

export const createAdminCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, icon, image, description } = req.body as {
    name?: string;
    icon?: string;
    image?: string;
    description?: string;
  };

  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 40) {
    res.status(400).json({ message: "Category name is required and must be between 2 and 40 characters." });
    return;
  }


  const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existingCat = await Category.findOne({
    name: { $regex: new RegExp(`^${escapedName}$`, "i") },
  });
  if (existingCat) {
    res.status(400).json({ message: "A category with this name already exists." });
    return;
  }


  const trimmedImage = typeof image === "string" ? image.trim() : "";
  if (
    !trimmedImage ||
    !trimmedImage.startsWith("https://") ||
    !trimmedImage.includes("res.cloudinary.com")
  ) {
    res.status(400).json({
      message: "Image URL is required for new categories and must be a secure HTTPS Cloudinary URL.",
    });
    return;
  }

  const category = await Category.create({
    name: trimmedName,
    icon: icon?.trim() || "Briefcase",
    image: trimmedImage,
    description: description?.trim() || undefined,
    isActive: true,
  });

  res.status(201).json({ category });
});

export const updateAdminCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({ message: "Category not found." });
    return;
  }


  if (req.body.name !== undefined) {
    res.status(400).json({
      message: "Category name cannot be changed because worker skills are linked by name.",
    });
    return;
  }

  const category = await Category.findById(id);
  if (!category) {
    res.status(404).json({ message: "Category not found." });
    return;
  }

  const { icon, image, isActive, description } = req.body as {
    icon?: string;
    image?: string;
    isActive?: boolean;
    description?: string;
  };

  // Protect "Other" from being hidden
  if (category.name.trim().toLowerCase() === "other" && isActive === false) {
    res.status(400).json({
      message: "The 'Other' category is protected and cannot be hidden.",
    });
    return;
  }

  if (icon !== undefined) {
    category.icon = icon.trim() || "Briefcase";
  }

  if (image !== undefined) {
    const trimmedImage = typeof image === "string" ? image.trim() : "";
    if (trimmedImage) {
      if (!trimmedImage.startsWith("https://") || !trimmedImage.includes("res.cloudinary.com")) {
        res.status(400).json({
          message: "Category image must be a secure HTTPS Cloudinary URL.",
        });
        return;
      }
      category.image = trimmedImage;
    } else {
      category.image = undefined;
    }
  }

  if (typeof isActive === "boolean") {
    category.isActive = isActive;
  }

  if (description !== undefined) {
    category.description = description.trim() || undefined;
  }

  await category.save();

  res.status(200).json({ category });
});


