import { Router } from "express";
import { addToCart, clearCart, getCart, removePFromCart, updateQuantity } from "../controllers/cart.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/addToCart").post(verifyJwt, addToCart);
router.route("/getCard").get(verifyJwt, getCart);
router.route("/removePFromCart/:productId").delete(verifyJwt, removePFromCart);
router.route("/clearCart").post(verifyJwt, clearCart);
router.route("/updateQuantity/:productId").patch(verifyJwt, updateQuantity);
export default router