import { Schema, model, Document, Types } from "mongoose";

interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface IWorker extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  skills: string[];
  experienceYears: number;
  serviceRadiusKm: number;
  visitingCharge: number;
  isAvailable: boolean;
  verificationStatus: "pending" | "verified" | "rejected";
  documents: string[];
  location?: GeoPoint;
  rating: number;
  totalReviews: number;
  completedJobsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const workerSchema = new Schema<IWorker>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    skills: [{ type: String }],
    experienceYears: { type: Number, default: 0 },
    serviceRadiusKm: { type: Number, default: 5 },
    visitingCharge: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    documents: [{ type: String }],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    completedJobsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

workerSchema.index({ location: "2dsphere" });

export const Worker = model<IWorker>("Worker", workerSchema);
