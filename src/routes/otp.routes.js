import { Router } from "express";
import { verifyEmailOtp } from "../controllers/otp.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/verifyEmailOtp").post(verifyJwt ,verifyEmailOtp);
export default router;