import { Request, Response } from "express";
import { User } from "../models/User";
import { asyncHandler } from "../middleware/asyncHandler";

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.status(200).json({ user });
});

export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.userId !== req.params.id) {
    res.status(403).json({ message: "You can only update your own profile" });
    return;
  }

  const { name, phone, profilePhoto } = req.body as {
    name?: string;
    phone?: string;
    profilePhoto?: string;
  };

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { name, phone, profilePhoto } },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.status(200).json({ user });
});

export const updateProfilePhoto = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const file = req.file || files?.image?.[0] || files?.profilePhoto?.[0];
  const imageUrl = file ? (file as any).path : req.body.profilePhoto;

  if (!imageUrl) {
    res.status(400).json({ message: "No image provided" });
    return;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { profilePhoto: imageUrl } },
    { new: true }
  );

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.status(200).json({
    message: "Profile photo updated successfully",
    profilePhoto: user.profilePhoto,
    user,
  });
});

