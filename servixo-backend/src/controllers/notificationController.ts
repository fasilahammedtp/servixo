import { Request, Response } from "express";
import { Notification } from "../models/Notification";
import { asyncHandler } from "../middleware/asyncHandler";

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({ notifications });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  res.status(200).json({ unreadCount });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const notification = await Notification.findById(id);
  if (!notification) {
    res.status(404).json({ message: "Notification not found" });
    return;
  }

  if (notification.recipient.toString() !== userId && req.user?.role !== "admin") {
    res.status(403).json({ message: "Not authorized to update this notification" });
    return;
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({ notification });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json({ message: "All notifications marked as read" });  
});

