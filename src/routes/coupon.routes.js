import { Router } from "express";
import { createCoupon, deleteCoupons, getAllCoupons, getCouponsById, updateCoupon } from "../controllers/coupon.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js"
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js"

const router = Router();

// All Routes Required Admin Permission
router.use(verifyJwt);
router.use(verifyAdmin);

router.route("/createCoupon").post(createCoupon);
router.route("/coupons").get(getAllCoupons);
router.route("/couponById/:couponId").get(getCouponsById);
router.route("/deleteCoupon/:couponId").delete(deleteCoupons);
router.route("/updateCoupon/:couponId").patch(updateCoupon);
export default router;