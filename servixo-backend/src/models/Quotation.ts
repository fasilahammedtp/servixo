import { Schema, model, Document, Types } from "mongoose";
import { QuotationStatus } from "../types";

export interface IQuotation extends Document {
  _id: Types.ObjectId;
  job: Types.ObjectId;
  worker: Types.ObjectId;
  price: number;
  etaMinutes: number;
  message?: string;
  status: QuotationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const quotationSchema = new Schema<IQuotation>(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    worker: { type: Schema.Types.ObjectId, ref: "Worker", required: true },
    price: { type: Number, required: true },
    etaMinutes: { type: Number, default: 30 },
    message: { type: String },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

quotationSchema.index({ job: 1, worker: 1 }, { unique: true });

export const Quotation = model<IQuotation>("Quotation", quotationSchema);
