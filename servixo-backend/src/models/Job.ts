import { Schema, model, Document, Types } from "mongoose";
import { JobStatus } from "../types";

interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface IJob extends Document {
  _id: Types.ObjectId;
  customer: Types.ObjectId;
  worker?: Types.ObjectId;
  category: Types.ObjectId;
  description: string;
  images: string[];
  location: GeoPoint;
  address?: string;
  status: JobStatus;
  finalPrice?: number;
  isPaid: boolean;
  paymentIssueReported: boolean;
  paymentIssueReportedAt?: Date;
  startedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    worker: { type: Schema.Types.ObjectId, ref: "Worker" },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    address: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "in_progress", "on_the_way", "arrived", "working", "completed", "cancelled"],
      default: "pending",
    },
    finalPrice: { type: Number },
    isPaid: { type: Boolean, default: false },
    paymentIssueReported: { type: Boolean, default: false },
    paymentIssueReportedAt: { type: Date },
    startedAt: { type: Date },
  },
  { timestamps: true }
);

jobSchema.index({ location: "2dsphere" });

export const Job = model<IJob>("Job", jobSchema);
