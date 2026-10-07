import { Request, Response } from "express";
import { Worker } from "../models/Worker";
import { User } from "../models/User";
import { asyncHandler } from "../middleware/asyncHandler";

export const getWorkers = asyncHandler(async (req: Request, res: Response) => {
  const workers = await Worker.find({ verificationStatus: "verified" }).populate(
    "user",
    "name profilePhoto"
  );
  res.status(200).json({ workers });
}); 

export const getWorkerProfile = asyncHandler(async (req: Request, res: Response) => {
  const worker = await Worker.findOne({ user: req.params.id }).populate(
    "user",
    "name profilePhoto"
  );
  if (!worker) {
    res.status(404).json({ message: "Worker profile not found" });
    return;
  }
  res.status(200).json({ worker });
});

export const updateWorkerProfile = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.userId !== req.params.id) {
    res.status(403).json({ message: "You can only update your own worker profile" });
    return;
  }

  const { skills, experienceYears, serviceRadiusKm, visitingCharge, documents, location } =
    req.body as {
      skills?: string[];
      experienceYears?: number;
      serviceRadiusKm?: number;
      visitingCharge?: number;
      documents?: string[];
      location?: { lat: number; lng: number };
    };

  const update: Record<string, unknown> = {
    skills,
    experienceYears,
    serviceRadiusKm,
    visitingCharge,
    documents,
    verificationStatus: "verified",
    isAvailable: true,
  };

  if (location) {
    update.location = { type: "Point", coordinates: [location.lng, location.lat] };
  }

  const worker = await Worker.findOneAndUpdate(
    { user: req.params.id },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );

  await User.findByIdAndUpdate(req.params.id, { hasCompletedOnboarding: true });

  res.status(200).json({ worker });
});

export const toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.userId !== req.params.id) {
    res.status(403).json({ message: "You can only update your own availability" });
    return;
  }

  const { isAvailable, location } = req.body as {
    isAvailable: boolean;
    location?: { lat: number; lng: number };
  };

  const update: Record<string, unknown> = { isAvailable };
  if (location) {
    update.location = { type: "Point", coordinates: [location.lng, location.lat] };
  }

  const worker = await Worker.findOneAndUpdate(
    { user: req.params.id },
    { $set: update },
    { new: true }
  );

  res.status(200).json({ worker });
});

export const becomeWorker = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const { skills, experienceYears, serviceRadiusKm, visitingCharge, location } = req.body as {
    skills?: string[];
    experienceYears?: number;
    serviceRadiusKm?: number;
    visitingCharge?: number;
    location?: { lat: number; lng: number };
  };

  const update: Record<string, unknown> = {
    skills: skills || [],
    experienceYears: experienceYears || 0,
    serviceRadiusKm: serviceRadiusKm || 10,
    visitingCharge: visitingCharge || 0,
    verificationStatus: "verified",
    isAvailable: true,
  };

  if (location) {
    update.location = { type: "Point", coordinates: [location.lng, location.lat] };
  }

  const worker = await Worker.findOneAndUpdate(
    { user: userId },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { hasWorkerProfile: true, hasCompletedOnboarding: true },
    { new: true }
  );

  res.status(200).json({
    message: "Worker profile created successfully!",
    worker,
    user: updatedUser,
  });
});
