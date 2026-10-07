import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
