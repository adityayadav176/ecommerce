import { Router } from "express";

import {getUserData, loginUser, logoutUser, refreshAccessToken, registerUser, updateFullName, updatePassword, updateProfilePicture, verifyEmail} from "../controllers/user.controller.js";
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
router.route("/updatePassword").post(verifyJwt ,updatePassword);
router.route("/verifyEmailOtp").post(verifyJwt ,verifyEmail);
router.route("/fetchedUser").get(verifyJwt ,getUserData);
router.route("/refresh-token").post(refreshAccessToken);
export default router