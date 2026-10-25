import { Schema, model, Document, Types } from "mongoose";
import { UserRole } from "../types";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  googleId?: string;
  profilePhoto?: string;
  role: UserRole;
  hasWorkerProfile: boolean;
  hasCustomerProfile: boolean;
  isBlocked: boolean;
  otpCode?: string;
  otpExpires?: Date;
  otpAttempts?: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, select: false },
    googleId: { type: String },
    profilePhoto: { type: String },
    role: { type: String, enum: ["customer", "worker", "admin"], required: true, default: "customer" },
    hasWorkerProfile: { type: Boolean, default: false },
    hasCustomerProfile: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    otpCode: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    isEmailVerified: { type: Boolean, default: false },
    hasCompletedOnboarding: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
