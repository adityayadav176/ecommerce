import { Router } from "express";

import {loginUser, logoutUser, registerUser, SendVerificationEmailOtp, updateFullName, updatePassword, updateProfilePicture} from "../controllers/user.controller.js";
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
router.route("/updatedAvatar").patch(
    verifyJwt,
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        }
    ]),
    updateProfilePicture
);

router.route("/SendVerificationOtp").post(verifyJwt ,SendVerificationEmailOtp);
router.route("/updatePassword").post(verifyJwt ,updatePassword);
export default router