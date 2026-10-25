import { z } from "zod";

export const createJobSchema = z
  .object({
    category: z.string().min(1, "Category is required"),
    customTitle: z.string().trim().optional(),
    description: z.string().min(10, "Description must be at least 10 characters"),
    images: z.array(z.string()).optional().default([]),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    address: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isOther = data.category.trim().toLowerCase() === "other";
    if (isOther) {
      const title = data.customTitle?.trim();
      if (!title || title.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Title is required for Other category",
          path: ["customTitle"],
        });
      } else if (title.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Custom title must be at least 3 characters",
          path: ["customTitle"],
        });
      } else if (title.length > 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Custom title must not exceed 60 characters",
          path: ["customTitle"],
        });
      }
    }
  })
  .transform((data) => {
    const isOther = data.category.trim().toLowerCase() === "other";
    return {
      ...data,
      customTitle: isOther ? data.customTitle?.trim() : undefined,
    };
  });
