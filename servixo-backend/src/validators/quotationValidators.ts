import { z } from "zod";

export const createQuotationSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  price: z.number().positive("Price must be a positive number"),
  message: z.string().optional(),
  etaMinutes: z.number().positive().optional().default(30),
});
