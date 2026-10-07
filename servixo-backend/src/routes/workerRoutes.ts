import { Router } from "express";
import {
  getWorkers,
  getWorkerProfile,
  updateWorkerProfile,
  toggleAvailability,
  becomeWorker,
} from "../controllers/workerController";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateWorkerSchema, toggleAvailabilitySchema } from "../validators/workerValidators";

const router = Router();

router.get("/", getWorkers);
router.post("/become-worker", requireAuth, becomeWorker);
router.get("/:id", getWorkerProfile);
router.put("/:id/profile", requireAuth, requireRole("worker"), validate(updateWorkerSchema), updateWorkerProfile);
router.put("/:id/availability", requireAuth, requireRole("worker"), validate(toggleAvailabilitySchema), toggleAvailability);

export default router;
