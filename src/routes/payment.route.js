import { Router } from "express";
import { verifyPayment } from "../controllers/payment.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/verify",verifyJwt, verifyPayment);
export default router;