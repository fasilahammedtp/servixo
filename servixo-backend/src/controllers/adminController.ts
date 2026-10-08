import { Request, Response } from "express";
import { Worker } from "../models/Worker";
import { User } from "../models/User";
import { Job } from "../models/Job";
import { Notification } from "../models/Notification";
import { sendRealtimeNotification } from "../config/socket";
import { sendWorkerVerificationEmail } from "../utils/email";
import { asyncHandler } from "../middleware/asyncHandler";

export const getPendingWorkers = asyncHandler(async (req: Request, res: Response) => {
  const workers = await Worker.find({ verificationStatus: "pending" }).populate(
    "user",
    "name email"
  );
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
    .select("customer worker category description finalPrice paymentIssueReported paymentIssueReportedAt isPaid")
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
