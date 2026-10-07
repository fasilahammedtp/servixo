import { Router } from "express";
import {
  createJob,
  getMyJobs,
  getJobById,
  getNearbyJobs,
  getWorkerAssignedJobs,
  getCustomerDashboardStats,
  getWorkerDashboardStats,
  startJob,
  completeJob,
  markJobPaid,
  reportPaymentIssue,
} from "../controllers/jobController";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createJobSchema } from "../validators/jobValidators";

const router = Router();

router.post("/", requireAuth, requireRole("customer"), validate(createJobSchema), createJob);
router.get("/mine", requireAuth, getMyJobs);
router.get("/nearby", requireAuth, requireRole("worker"), getNearbyJobs);
router.get("/worker/my-jobs", requireAuth, requireRole("worker"), getWorkerAssignedJobs);
router.get("/customer/dashboard-stats", requireAuth, requireRole("customer"), getCustomerDashboardStats);
router.get("/worker/dashboard-stats", requireAuth, requireRole("worker"), getWorkerDashboardStats);

router.patch("/:jobId/start", requireAuth, requireRole("worker"), startJob);
router.patch("/:jobId/complete", requireAuth, requireRole("worker"), completeJob);
router.patch("/:jobId/mark-paid", requireAuth, requireRole("customer"), markJobPaid);
router.post("/:jobId/report-payment-issue", requireAuth, requireRole("worker"), reportPaymentIssue);

router.get("/:id", requireAuth, getJobById);

export default router;
