import { Router } from "express";
import {register,login,getMe,forgotPassword,resetPassword,verifyOtp,resendOtp,} from "../controllers/authController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {registerSchema,loginSchema,verifyOtpSchema,resendOtpSchema,forgotPasswordSchema, resetPasswordSchema} from "../validators/authValidators";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", requireAuth, getMe);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", validate(resendOtpSchema), resendOtp);

export default router;