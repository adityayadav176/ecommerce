import { Router } from "express";
import {verifyJwt} from "../middleware/auth.middleware.js"
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
import { addCategory, changeCategoryImage, deleteCategoryBySlug, getAllCategory, getCategoryBySlug, toggleIsActive, updateCategory } from "../controllers/category.controller.js";
import { upload } from "../middleware/multer.middleware.js";
const router = Router();


router.route("/addCategory").post(
    verifyJwt,
    verifyAdmin,
    upload.fields([
        {
            name: "image",
            maxCount: 1,
        },
    ]),
     addCategory
);

router.route("/updatedCategory/:slug").patch(verifyJwt, verifyAdmin, updateCategory);
router.route("/getCategory/:slug").get(verifyJwt, getCategoryBySlug);
router.route("/deleteCategory/:slug").delete(verifyJwt, verifyAdmin, deleteCategoryBySlug);
router.route("/changeCategoryImage/:slug").patch(
    verifyJwt,
    verifyAdmin,
    upload.fields([
        {
            name: "image",
            maxCount: 1,
        }
    ]),
    changeCategoryImage
);
router.route("/toggleIsActive/:slug").patch(verifyJwt, verifyAdmin, toggleIsActive);
router.route("/getAllCategories").get(verifyJwt ,getAllCategory)
export default router;