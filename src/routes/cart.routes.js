import { Router } from "express";
import { addToCart } from "../controllers/cart.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/addToCart").post(verifyJwt, addToCart);
export default router