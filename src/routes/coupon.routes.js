import { Router } from "express";
import { createCoupon } from "../controllers/coupon.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js"
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js"

const router = Router();

// All Routes Required Admin Permission
router.use(verifyAdmin);
router.use(verifyJwt);

router.route("/createCoupon").post(createCoupon);
export default router;