import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { AddProduct } from "../controllers/product.controller.js";
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

export default router;