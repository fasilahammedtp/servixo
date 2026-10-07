import { Router } from "express";
import { createReview, getWorkerReviews, getJobReview } from "../controllers/reviewController";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, requireRole("customer"), createReview);
router.get("/worker/:workerId", getWorkerReviews);
router.get("/job/:jobId", requireAuth, getJobReview);

export default router;
