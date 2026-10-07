import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "job_matched"
  | "quote_received"
  | "quote_accepted"
  | "job_started"
  | "job_completed"
  | "payment_confirmed"
  | "payment_reminder"
  | "review_received";

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  type: NotificationType;
  message: string;
  job?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "job_matched",
        "quote_received",
        "quote_accepted",
        "job_started",
        "job_completed",
        "payment_confirmed",
        "payment_reminder",
        "review_received",
      ],
      required: true,
    },
    message: { type: String, required: true },
    job: { type: Schema.Types.ObjectId, ref: "Job" },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Notification = model<INotification>("Notification", notificationSchema);
