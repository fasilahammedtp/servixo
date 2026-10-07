import express, { Request, Response } from "express";
import { upload } from "../middleware/upload";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

router.post("/", requireAuth, upload.array("images", 5), (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
       res.status(400).json({ message: "No images provided" });
       return;
    }

    const urls = (req.files as Express.Multer.File[]).map((file: any) => file.path);

    res.status(200).json({ urls });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error });
  }
});

export default router;
