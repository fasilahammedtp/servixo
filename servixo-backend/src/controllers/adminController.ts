import { Request, Response } from "express";
import { Worker } from "../models/Worker";
import { User } from "../models/User";
import { Job } from "../models/Job";
import { asyncHandler } from "../middleware/asyncHandler";

export const getPendingWorkers = asyncHandler(async (req: Request, res: Response) => {
  const workers = await Worker.find({ verificationStatus: "pending" }).populate(
    "user",
    "name email"
  );
  res.status(200).json({ workers });
});

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
  );

  if (!worker) {
    res.status(404).json({ message: "Worker not found for this user id" });
    return;
  }

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

  res.status(200).json({ worker });
}

export const verifyWorker = asyncHandler(async (req: Request, res: Response) => {
  await setWorkerVerificationStatus(req.params.workerId, "verified", res);
});

export const rejectWorker = asyncHandler(async (req: Request, res: Response) => {
  await setWorkerVerificationStatus(req.params.workerId, "rejected", res);
});

export const getPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalCustomers, totalWorkers, jobStatusCounts] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ $or: [{ role: "customer" }, { hasCustomerProfile: true }] }),
    Worker.countDocuments(),
    Job.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
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

  res.status(200).json({
    totalUsers,
    totalCustomers,
    totalWorkers,
    jobsByStatus,
    totalCompletedJobs: jobsByStatus.completed,
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
    .select("customer worker category finalPrice paymentIssueReported paymentIssueReportedAt isPaid")
    .sort({ paymentIssueReportedAt: -1 });

  res.status(200).json({ jobs });
});
