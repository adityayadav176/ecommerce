import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { addDiscountPrice, AddProduct, AddSippingCost, changeProductStatus, deleteProduct, getAllMyProducts, getAllProduct, getProductById, getProductRatings, toggleIsPublished, updateProductDetails, updateRating, updateStock} from "../controllers/product.controller.js";
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
router.route("/my-products").get(verifyJwt, getAllMyProducts);
router.route("/updateShippingCost/:productId").patch(verifyJwt, AddSippingCost);
router.route("/updateStatus/:productId").patch(verifyJwt, changeProductStatus);
router.route("/toggleIsPublished/:productId").patch(verifyJwt, toggleIsPublished);
router.route("/addDiscountPrice/:productId").patch(verifyJwt, addDiscountPrice);
router.route("/updateDetails/:productId").patch(verifyJwt, updateProductDetails);
router.route("/updateStock/:productId").patch(verifyJwt, updateStock);
router.route("/rating/:productId").patch(verifyJwt, updateRating);
router.route("/rating/:productId").get(verifyJwt, getProductRatings);

export default router;