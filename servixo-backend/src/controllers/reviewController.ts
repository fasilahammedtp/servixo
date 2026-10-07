import { Request, Response } from "express";
import { Review } from "../models/Review";
import { Job } from "../models/Job";
import { Worker } from "../models/Worker";
import { Notification } from "../models/Notification";
import { sendRealtimeNotification } from "../config/socket";
import { asyncHandler } from "../middleware/asyncHandler";

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { jobId, rating, comment } = req.body as {
    jobId: string;
    rating: number;
    comment?: string;
  };

  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!jobId) {
    res.status(400).json({ message: "jobId is required" });
    return;
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    return;
  }

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404).json({ message: "Job not found" });
    return;
  }

  // Only job customer can submit review
  if (job.customer.toString() !== userId) {
    res.status(403).json({ message: "Only the customer for this job can submit a review" });
    return;
  }

  // Job must be completed and paid
  if (job.status !== "completed" || !job.isPaid) {
    res.status(400).json({ message: "Reviews can only be submitted for completed and paid jobs" });
    return;
  }

  if (!job.worker) {
    res.status(400).json({ message: "This job does not have an assigned worker" });
    return;
  }

  // Check if review already exists for this job
  const existingReview = await Review.findOne({ job: jobId });
  if (existingReview) {
    res.status(400).json({ message: "A review has already been submitted for this job" });
    return;
  }

  const review = await Review.create({
    job: jobId,
    customer: userId,
    worker: job.worker,
    rating,
    comment: comment?.trim() || undefined,
  });

  // Recalculate worker's average rating & totalReviews count
  const workerReviews = await Review.find({ worker: job.worker });
  const totalReviews = workerReviews.length;
  const sumRating = workerReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;

  const updatedWorker = await Worker.findByIdAndUpdate(
    job.worker,
    {
      rating: averageRating,
      totalReviews,
    },
    { new: true }
  );

  if (updatedWorker && updatedWorker.user) {
    try {
      const notification = await Notification.create({
        recipient: updatedWorker.user,
        type: "review_received",
        message: `You received a ${rating}-star review for your completed job!`,
        job: job._id,
      });

      const notificationPayload = {
        ...notification.toObject(),
        averageRating,
        totalReviews,
      };

      sendRealtimeNotification(updatedWorker.user.toString(), notificationPayload);
    } catch (notifErr) {
      console.error("[Review Notification ERROR]: Failed to send notification:", notifErr);
    }
  }

  res.status(201).json({
    message: "Review submitted successfully",
    review,
  });
});

export const getWorkerReviews = asyncHandler(async (req: Request, res: Response) => {
  const { workerId } = req.params;

  const reviews = await Review.find({ worker: workerId })
    .populate("customer", "name profilePhoto")
    .sort({ createdAt: -1 });

  res.status(200).json({ reviews });
});

export const getJobReview = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const review = await Review.findOne({ job: jobId }).populate("customer", "name profilePhoto");

  res.status(200).json({ review: review || null });
});
