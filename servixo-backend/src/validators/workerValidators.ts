import { z } from "zod";

export const updateWorkerSchema = z.object({
  skills: z.array(z.string()).optional(),
  experienceYears: z.number().min(0, "Experience years cannot be negative").optional(),
  serviceRadiusKm: z.number().min(1, "Service radius must be at least 1km").optional(),
  visitingCharge: z.number().min(0, "Visiting charge cannot be negative").optional(),
  documents: z.array(z.string().url("Document must be a valid URL")).optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean({
    message: "isAvailable must be a boolean",
  }),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});
