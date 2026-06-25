import { Router } from "express";
import { applyCoupon, createCoupon, deleteCoupons, getAllCoupons, getCouponsById, updateCoupon } from "../controllers/coupon.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js"
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js"

const router = Router();

// All Routes Required Admin Permission
router.use(verifyJwt);

router.route("/createCoupon").post(verifyAdmin ,createCoupon);
router.route("/coupons").get(verifyAdmin ,getAllCoupons);
router.route("/couponById/:couponId").get(verifyAdmin ,getCouponsById);
router.route("/deleteCoupon/:couponId").delete(verifyAdmin ,deleteCoupons);
router.route("/updateCoupon/:couponId").patch(verifyAdmin ,updateCoupon);
router.route("/applyCoupon").post(applyCoupon);
export default router;