import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  phone: z.string().optional(),
  profilePhoto: z.string().optional(),
});
