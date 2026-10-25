import { Router } from "express";
import { getBadgeSummary, markBadgesSeen } from "../controllers/badgeController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/summary", requireAuth, getBadgeSummary);
router.patch("/seen", requireAuth, markBadgesSeen);

export default router;
