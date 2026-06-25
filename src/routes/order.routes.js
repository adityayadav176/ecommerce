import { Router } from "express";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { cancelOrder, createOrder, getMyOrders, getOrderById, updateOrderStatus } from "../controllers/order.controller.js";

const router = Router();

router.post("/create-order", verifyJwt, createOrder);
router.get("/my-orders", verifyJwt, getMyOrders);
router.get("/:orderId", verifyJwt, getOrderById);
router.patch("/cancel/:orderId", verifyJwt, cancelOrder);
router.patch("/status/:orderId",verifyAdmin, verifyJwt, updateOrderStatus);
export default router;