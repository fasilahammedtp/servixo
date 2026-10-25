import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { User } from "../models/User";
import { Worker } from "../models/Worker";
import { signToken } from "../utils/jwt";
import { sendPasswordResetEmail, sendOtpEmail } from "../utils/email";
import { generateOtp, hashOtp } from "../utils/otp";
import { UserRole } from "../types";
import { asyncHandler } from "../middleware/asyncHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password, role } = req.body as {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: UserRole;
  };

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.isEmailVerified) {
      res.status(400).json({ message: "An account with this email already exists" });
      return;
    }

    // Re-signup for unverified account: update existing user details and issue new OTP
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);

    existing.name = name;
    if (phone !== undefined) {
      existing.phone = phone;
    }
    existing.password = hashedPassword;
    existing.role = role;
    existing.hasWorkerProfile = role === "worker";
    existing.hasCustomerProfile = true;
    existing.otpCode = hashedOtp;
    existing.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    existing.otpAttempts = 0;
    await existing.save();

    // Keep Worker document consistent with the chosen role
    if (role === "worker") {
      const existingWorker = await Worker.findOne({ user: existing._id });
      if (!existingWorker) {
        await Worker.create({
          user: existing._id,
          verificationStatus: "pending",
          isAvailable: false,
        });
      }
    } else {
      // Remove any pending worker profile created in previous signup attempts
      await Worker.deleteOne({ user: existing._id });
    }

    const token = signToken({ userId: existing._id.toString(), role: existing.role });

    // Send OTP email without blocking the response
    sendOtpEmail(email, otp).catch((error) => {
      console.warn("Could not send OTP email:", error);
    });

    res.status(201).json({
      token,
      user: {
        id: existing._id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        role: existing.role,
        profilePhoto: existing.profilePhoto,
        hasWorkerProfile: existing.hasWorkerProfile,
        hasCustomerProfile: true,
      },
      message: "Registration updated. Please verify your email.",
      ...(process.env.NODE_ENV !== "production" ? { devOnly_otp: otp } : {}),
      emailSent: true,
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const otp = generateOtp();
  const hashedOtp = hashOtp(otp);

  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role,
    hasWorkerProfile: role === "worker",
    hasCustomerProfile: true,
    otpCode: hashedOtp,
    otpExpires: new Date(Date.now() + 10 * 60 * 1000),
    otpAttempts: 0,
  });

  if (role === "worker") {
    await Worker.create({
      user: user._id,
      verificationStatus: "pending",
      isAvailable: false,
    });
  }

  const token = signToken({ userId: user._id.toString(), role: user.role });

  // Send OTP email without blocking the response
  sendOtpEmail(email, otp).catch((error) => {
    console.warn("Could not send OTP email:", error);
  });

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePhoto: user.profilePhoto,
      hasWorkerProfile: user.hasWorkerProfile,
      hasCustomerProfile: true,
    },
    message: "Registration successful. Please verify your email.",
    ...(process.env.NODE_ENV !== "production" ? { devOnly_otp: otp } : {}),
    emailSent: true,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.password) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ message: "This account has been blocked. Contact support." });
    return;
  }

  if (!user.isEmailVerified) {
    res.status(403).json({ message: "Please verify your email first" });
    return;
  }

  const token = signToken({ userId: user._id.toString(), role: user.role });

  res.status(200).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePhoto: user.profilePhoto,
      hasWorkerProfile: user.hasWorkerProfile || user.role === "worker",
      hasCustomerProfile: user.hasCustomerProfile || user.role === "customer" || user.role === "worker",
    },
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const userObj = user.toObject();
  res.status(200).json({
    user: {
      ...userObj,
      hasWorkerProfile: userObj.hasWorkerProfile || userObj.role === "worker",
      hasCustomerProfile: userObj.hasCustomerProfile || userObj.role === "customer" || userObj.role === "worker",
    },
  });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body as { email: string; otp: string };

  const user = await User.findOne({ email }).select("+otpCode +otpExpires +otpAttempts");
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (user.isEmailVerified) {
    res.status(200).json({ message: "Account is already verified" });
    return;
  }

  const MAX_ATTEMPTS = 5;
  const currentAttempts = user.otpAttempts || 0;

  if (currentAttempts >= MAX_ATTEMPTS) {
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save();
    res.status(400).json({ message: "Too many failed attempts. Please request a new OTP." });
    return;
  }

  if (!user.otpCode || !user.otpExpires) {
    res.status(400).json({ message: "No OTP found. Please request a new one." });
    return;
  }

  if (user.otpExpires < new Date()) {
    res.status(400).json({ message: "OTP has expired. Please request a new one." });
    return;
  }

  const hashedOtp = hashOtp(otp);
  if (hashedOtp !== user.otpCode) {
    user.otpAttempts = currentAttempts + 1;
    const remaining = MAX_ATTEMPTS - user.otpAttempts;
    if (remaining <= 0) {
      user.otpCode = undefined;
      user.otpExpires = undefined;
      user.otpAttempts = 0;
      await user.save();
      res.status(400).json({
        message: "Too many failed attempts. OTP has been invalidated. Please request a new one.",
      });
      return;
    }
    await user.save();
    res.status(400).json({
      message: `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    });
    return;
  }

  user.isEmailVerified = true;
  if (user.role === "customer") {
    user.hasCompletedOnboarding = true;
  }

  user.otpCode = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  await user.save();

  res.status(200).json({ message: "Email verified successfully" });
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (user.isEmailVerified) {
    res.status(400).json({ message: "Account is already verified" });
    return;
  }

  const otp = generateOtp();
  const hashedOtp = hashOtp(otp);

  user.otpCode = hashedOtp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  user.otpAttempts = 0;
  await user.save();

  // Send OTP email without blocking the response
  sendOtpEmail(email, otp).catch((error) => {
    console.warn("Could not send OTP email:", error);
  });

  res.status(200).json({
    message: "OTP sent successfully",
    ...(process.env.NODE_ENV !== "production" ? { devOnly_otp: otp } : {}),
    emailSent: true,
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  const user = await User.findOne({ email });

  const genericResponse = {
    message: "If an account with that email exists, a password reset link has been generated.",
  };

  if (!user) {
    res.status(200).json(genericResponse);
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;

  let emailSent = false;
  try {
    await sendPasswordResetEmail(email, resetLink);
    emailSent = true;
  } catch (emailErr) {
    console.warn("Could not send reset email:", emailErr);
  }

  res.status(200).json({
    ...genericResponse,
    emailSent,
    ...(process.env.NODE_ENV !== "production"
      ? {
          devOnly_resetToken: rawToken,
          devOnly_note: emailSent
            ? "Email sent successfully — check your inbox."
            : "Email could not be sent. Use this token to test instead.",
        }
      : {}),
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() }, // token must not be expired
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    res.status(400).json({ message: "This reset link is invalid or has expired" });
    return;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password has been reset successfully. You can now log in." });
});