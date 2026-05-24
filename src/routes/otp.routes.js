import { Router } from "express";
import { sendPasswordResetOtp, SendVerificationEmailOtp } from "../controllers/otp.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";


const router = Router()


router.route("/sendPasswordResetOtp").post(verifyJwt, sendPasswordResetOtp);
router.route("/SendVerificationOtp").post(verifyJwt ,SendVerificationEmailOtp);
export default router;