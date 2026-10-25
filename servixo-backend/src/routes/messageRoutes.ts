import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getConversations, getUnreadCount } from "../controllers/messageController";

const router = Router();

router.get("/conversations", requireAuth, getConversations);
router.get("/unread-count", requireAuth, getUnreadCount);

export default router;
