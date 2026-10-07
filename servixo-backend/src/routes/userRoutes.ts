import { Router } from "express";
import { getUserProfile, updateUserProfile, updateProfilePhoto } from "../controllers/userController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateUserSchema } from "../validators/userValidators";
import { upload } from "../middleware/upload";

const router = Router();

router.patch(
  "/profile-photo",
  requireAuth,
  upload.fields([{ name: "image", maxCount: 1 }, { name: "profilePhoto", maxCount: 1 }]),
  updateProfilePhoto
);
router.get("/:id", requireAuth, getUserProfile);
router.put("/:id", requireAuth, validate(updateUserSchema), updateUserProfile);

export default router;

