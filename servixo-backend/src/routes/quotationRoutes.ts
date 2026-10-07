import { Router } from "express";
import {
  createQuotation,
  getQuotationsForJob,
  getMyQuotations,
  acceptQuotation,
} from "../controllers/quotationController";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createQuotationSchema } from "../validators/quotationValidators";

const router = Router();

router.post("/", requireAuth, requireRole("worker"), validate(createQuotationSchema), createQuotation);
router.get("/job/:jobId", requireAuth, getQuotationsForJob);
router.get("/my-quotes", requireAuth, requireRole("worker"), getMyQuotations);
router.patch("/:quotationId/accept", requireAuth, acceptQuotation);

export default router;
