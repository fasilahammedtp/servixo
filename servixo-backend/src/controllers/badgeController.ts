import { Request, Response } from "express";
import { Types } from "mongoose";
import { Message } from "../models/Message";
import { Notification } from "../models/Notification";
import { asyncHandler } from "../middleware/asyncHandler";

export const BOOKING_NOTIFICATION_TYPES = [
  "quote_received",
  "job_started",
  "job_completed",
  "payment_reminder",
];

export const HIRED_JOB_NOTIFICATION_TYPES = [
  "quote_accepted",
  "payment_confirmed",
  "review_received",
];

/**
 * GET /api/badges/summary
 * Returns { messages, bookings, hiredJobs, bookingJobIds, hiredJobIds }
 * Computed live with aggregation, no per-row loops.
 */
export const getBadgeSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const userObjectId = new Types.ObjectId(userId);

  // 1. Aggregation for distinct jobs behind unread notifications for bookings and hiredJobs
  const [notifAggregation, unreadMessagesCount] = await Promise.all([
    Notification.aggregate([
      {
        $match: {
          recipient: userObjectId,
          isRead: false,
          job: { $exists: true, $ne: null },
          type: { $in: [...BOOKING_NOTIFICATION_TYPES, ...HIRED_JOB_NOTIFICATION_TYPES] },
        },
      },
      {
        $group: {
          _id: {
            section: {
              $cond: [
                { $in: ["$type", BOOKING_NOTIFICATION_TYPES] },
                "bookings",
                "hiredJobs",
              ],
            },
            job: "$job",
          },
        },
      },
      {
        $group: {
          _id: "$_id.section",
          jobIds: { $push: "$_id.job" },
        },
      },
    ]),
    Message.countDocuments({
      recipient: userObjectId,
      readAt: null,
    }),
  ]);

  let bookingJobIds: string[] = [];
  let hiredJobIds: string[] = [];

  for (const group of notifAggregation) {
    if (group._id === "bookings") {
      bookingJobIds = group.jobIds.map((id: any) => id.toString());
    } else if (group._id === "hiredJobs") {
      hiredJobIds = group.jobIds.map((id: any) => id.toString());
    }
  }

  res.status(200).json({
    messages: unreadMessagesCount,
    bookings: bookingJobIds.length,
    hiredJobs: hiredJobIds.length,
    bookingJobIds,
    hiredJobIds,
  });
});

/**
 * PATCH /api/badges/seen
 * Body: { section: "bookings" | "hiredJobs" }
 * Marks those notifications read for me. Validate the section value.
 */
export const markBadgesSeen = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { section } = req.body as { section?: string };

  if (section !== "bookings" && section !== "hiredJobs") {
    res.status(400).json({
      message: "Invalid section. Must be either 'bookings' or 'hiredJobs'.",
    });
    return;
  }

  const typesToMarkRead =
    section === "bookings" ? BOOKING_NOTIFICATION_TYPES : HIRED_JOB_NOTIFICATION_TYPES;

  const updateResult = await Notification.updateMany(
    {
      recipient: userId,
      type: { $in: typesToMarkRead },
      isRead: false,
    },
    {
      $set: { isRead: true },
    }
  );

  res.status(200).json({
    message: `Marked ${section} notifications as read`,
    modifiedCount: updateResult.modifiedCount,
  });
});
