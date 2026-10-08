import { Router } from "express";
import {
  getPendingWorkers,
  updateWorkerVerification,
  verifyWorker,
  rejectWorker,
  getPlatformStats,
  getPaymentIssues,
  getAdminUsers,
  blockUser,
  unblockUser,
} from "../controllers/adminController";
import { requireAuth } from "../middleware/auth";
import { Request, Response, NextFunction } from "express";

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "You don't have permission to access this resource" });
    return;
  }
  next();
}

const router = Router();

router.get("/stats", requireAuth, requireAdmin, getPlatformStats);
router.get("/payment-issues", requireAuth, requireAdmin, getPaymentIssues);
router.get("/pending-workers", requireAuth, requireAdmin, getPendingWorkers);
router.put("/workers/:id/verification", requireAuth, requireAdmin, updateWorkerVerification);

router.get("/workers/pending", requireAuth, requireAdmin, getPendingWorkers);
router.patch("/workers/:workerId/verify", requireAuth, requireAdmin, verifyWorker);
router.patch("/workers/:workerId/reject", requireAuth, requireAdmin, rejectWorker);

router.get("/users", requireAuth, requireAdmin, getAdminUsers);
router.patch("/users/:userId/block", requireAuth, requireAdmin, blockUser);
router.patch("/users/:userId/unblock", requireAuth, requireAdmin, unblockUser);

export default router;
