import { Router } from "express";
import { addToWisList, deleteProductToWishlist } from "../controllers/wislist.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/addToWishlist/:productId").post(verifyJwt ,addToWisList);
router.route("/deleteProductFromWishlist/:productId").delete(verifyJwt ,deleteProductToWishlist);
export default router