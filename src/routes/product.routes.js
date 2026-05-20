import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { AddProduct, deleteProduct, getAllProduct, getProductById } from "../controllers/product.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/addProduct").post(
    verifyJwt,
    upload.fields([
        {
            name: "images",
            maxCount: 5,
        },
    ]),
    AddProduct
);

router.route("/:productId").delete(verifyJwt, deleteProduct);
router.route("/product/:productId").get(verifyJwt, getProductById);
router.route("/getAllProduct").get(getAllProduct);
export default router;