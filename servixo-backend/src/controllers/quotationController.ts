import { Request, Response } from "express";
import { Quotation } from "../models/Quotation";
import { Job } from "../models/Job";
import { Worker } from "../models/Worker";
import { Category } from "../models/Category";
import { Notification } from "../models/Notification";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendRealtimeNotification } from "../config/socket";
import { sendJobHiredEmail, sendQuoteReceivedEmail } from "../utils/email";
import { getJobCategoryDisplay } from "../utils/jobUtils";

export const createQuotation = asyncHandler(async (req: Request, res: Response) => {
  const { jobId, price, message, etaMinutes } = req.body as {
    jobId: string;
    price: number;
    message?: string;
    etaMinutes?: number;
  };

  const userId = req.user?.userId;

  const worker = await Worker.findOne({ user: userId }).populate("user", "name");
  if (!worker) {
    res.status(404).json({ message: "Worker profile not found" });
    return;
  }

  if (worker.verificationStatus !== "verified") {
    res.status(403).json({ message: "Your worker account is not verified yet" });
    return;
  }

  const job = await Job.findById(jobId)
    .populate("category", "name")
    .populate("customer", "name email");
  if (!job) {
    res.status(404).json({ message: "Job request not found" });
    return;
  }

  if (job.status !== "pending") {
    res.status(400).json({ message: "This job request is no longer open for quotes" });
    return;
  }

  const existingQuotation = await Quotation.findOne({ job: jobId, worker: worker._id });
  if (existingQuotation) {
    res.status(400).json({ message: "You have already submitted a quote for this job" });
    return;
  }

  const quotation = await Quotation.create({
    job: jobId,
    worker: worker._id,
    price,
    message,
    etaMinutes: etaMinutes || 30,
    status: "pending",
  });

  const customerId = (job.customer as any)?._id
    ? (job.customer as any)._id.toString()
    : job.customer.toString();

  try {
    const workerName = (worker.user as any)?.name || "A worker";
    const categoryName = getJobCategoryDisplay(job);

    const notification = await Notification.create({
      recipient: customerId,
      type: "quote_received",
      message: `${workerName} sent you a quote for ${categoryName}`,
      job: job._id,
    });

    sendRealtimeNotification(customerId, notification);
  } catch (notifErr) {
    console.error("[Quotation Creation Notification ERROR]:", notifErr);
  }

  // Send email to job's customer in an isolated try/catch block
  try {
    const customerUser = job.customer as any;
    const customerEmail = customerUser?.email;
    const customerName = customerUser?.name || "Customer";
    const workerUser = worker.user as any;
    const workerName = workerUser?.name || "Service Professional";
    const categoryName = getJobCategoryDisplay(job);

    if (customerEmail) {
      await sendQuoteReceivedEmail({
        to: customerEmail,
        customerName,
        categoryName,
        workerName,
        workerRating: worker.rating || 5.0,
        workerSkills: worker.skills,
        quotedPrice: price,
        etaMinutes: etaMinutes || 30,
        workerMessage: message,
      });
      console.log("[Quote Received Email SUCCESS] Email notification sent to customer");
    }
  } catch (emailErr) {
    console.error("[Quote Received Email ERROR]: Failed to send email to customer:", emailErr);
  }

  res.status(201).json({
    message: "Quote submitted successfully",
    quotation,
  });
});

export const getQuotationsForJob = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const userId = req.user?.userId;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404).json({ message: "Job request not found" });
    return;
  }

  if (job.customer.toString() !== userId && req.user?.role !== "admin") {
    res.status(403).json({ message: "Not authorized to view quotes for this job" });
    return;
  }

  const quotations = await Quotation.find({ job: jobId })
    .populate({
      path: "worker",
      select: "rating totalReviews skills visitingCharge experienceYears user",
      populate: {
        path: "user",
        select: "name profilePhoto phone email",
      },
    })
    .sort({ createdAt: -1 });

  quotations.sort((a: any, b: any) => {
    const ratingA = a.worker?.rating ?? 0;
    const ratingB = b.worker?.rating ?? 0;
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }
    const expA = a.worker?.experienceYears ?? 0;
    const expB = b.worker?.experienceYears ?? 0;
    return expB - expA;
  });

  res.status(200).json({ quotations });
});

export const getMyQuotations = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const worker = await Worker.findOne({ user: userId });
  if (!worker) {
    res.status(404).json({ message: "Worker profile not found" });
    return;
  }

  const quotations = await Quotation.find({ worker: worker._id })
    .populate("job")
    .sort({ createdAt: -1 });

  res.status(200).json({ quotations });
});

export const acceptQuotation = asyncHandler(async (req: Request, res: Response) => {
  const { quotationId } = req.params;
  const userId = req.user?.userId;

  const quotation = await Quotation.findById(quotationId).populate({
    path: "worker",
    select: "user",
    populate: {
      path: "user",
      select: "name email phone",
    },
  });
  if (!quotation) {
    res.status(404).json({ message: "Quotation not found" });
    return;
  }

  const job = await Job.findById(quotation.job)
    .populate("category", "name")
    .populate("customer", "name phone email");
  if (!job) {
    res.status(404).json({ message: "Associated job not found" });
    return;
  }

  const customerId = (job.customer as any)?._id
    ? (job.customer as any)._id.toString()
    : job.customer.toString();

  // Only the job's customer (or admin) can accept a quotation
  if (customerId !== userId && req.user?.role !== "admin") {
    res.status(403).json({ message: "Not authorized to accept quotes for this job" });
    return;
  }

  // Set selected quotation status to accepted
  quotation.status = "accepted";
  await quotation.save();

  // Set all other quotations for this job to rejected
  await Quotation.updateMany(
    { job: job._id, _id: { $ne: quotation._id } },
    { $set: { status: "rejected" } }
  );

  // Update parent Job status, worker reference, and final price
  job.status = "accepted";
  job.worker = (quotation.worker as any)._id || quotation.worker;
  job.finalPrice = quotation.price;
  await job.save();

  // Create notification for worker & emit socket event
  try {
    const workerUser = (quotation.worker as any)?.user;
    const workerUserId = workerUser?._id?.toString() || workerUser?.id?.toString() || workerUser?.toString();
    const categoryName = getJobCategoryDisplay(job);

    if (workerUserId) {
      const notification = await Notification.create({
        recipient: workerUserId,
        type: "quote_accepted",
        message: `Your quote for ${categoryName} was accepted!`,
        job: job._id,
      });

      sendRealtimeNotification(workerUserId, notification);
    }
  } catch (notifErr) {
    console.error("[Quotation Accept Notification ERROR]:", notifErr);
  }

  // Send email to hired worker in its own isolated try/catch block
  try {
    const workerUser = (quotation.worker as any)?.user;
    const workerEmail = workerUser?.email;
    const workerName = workerUser?.name || "Service Professional";
    const categoryName = getJobCategoryDisplay(job);
    const customerUser = job.customer as any;
    const customerName = customerUser?.name || "Customer";
    const customerPhone = customerUser?.phone;

    if (workerEmail) {
      await sendJobHiredEmail({
        to: workerEmail,
        workerName,
        categoryName,
        jobDescription: job.description,
        agreedPrice: quotation.price,
        customerName,
        customerPhone,
      });
      console.log("[Job Hired Email SUCCESS] Email notification sent to worker");
    }
  } catch (emailErr) {
    console.error("[Job Hired Email ERROR]: Failed to send email to worker:", emailErr);
  }

  res.status(200).json({
    message: "Quotation accepted successfully",
    quotation,
    job,
  });
});
