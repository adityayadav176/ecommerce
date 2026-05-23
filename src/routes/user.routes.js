import { Router } from "express";

import {loginUser, logoutUser, registerUser, updateFullName} from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js"
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser);
router.route("/logout").post( verifyJwt, logoutUser);
router.route("/updateFullName").patch(verifyJwt, updateFullName);

export default router