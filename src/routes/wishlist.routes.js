import { Router } from "express";
import { addToWisList, clearWishlist, deleteProductToWishlist,getWishlist } from "../controllers/wishlist.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/addToWishlist/:productId").post(verifyJwt ,addToWisList);
router.route("/deleteProductFromWishlist/:productId").delete(verifyJwt ,deleteProductToWishlist);
router.route("/fetchedWishlist").get(verifyJwt, getWishlist);
router.route("/clearWishlist").delete(verifyJwt, clearWishlist);
export default router