import { z } from "zod";

export const createJobSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  images: z.array(z.string()).optional().default([]),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  address: z.string().optional(),
});
