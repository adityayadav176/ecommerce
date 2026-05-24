import { Router } from "express";
import { sendPasswordResetOtp, verifyEmailOtp } from "../controllers/otp.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/verifyEmailOtp").post(verifyJwt ,verifyEmailOtp);
router.route("/sendPasswordResetOtp").post(verifyJwt, sendPasswordResetOtp);
export default router;