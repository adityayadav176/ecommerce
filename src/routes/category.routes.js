import { Router } from "express";
import {verifyJwt} from "../middleware/auth.middleware.js"
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
import { addCategory } from "../controllers/category.controller.js";
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
export default router;