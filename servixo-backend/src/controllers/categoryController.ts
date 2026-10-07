import { Request, Response } from "express";
import { Category } from "../models/Category";
import { asyncHandler } from "../middleware/asyncHandler";

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ categories });
});