import { Router } from "express";
import {verifyJwt} from "../middleware/auth.middleware.js"
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
import { addCategory, updateCategory } from "../controllers/category.controller.js";
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
export default router;