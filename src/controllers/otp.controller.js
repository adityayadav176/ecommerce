import { Otp } from "../model/otp.model";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyEmailOtp = asyncHandler(async (req, res) => {
    const {otp} = req.body

    if(!otp) {
        throw new ApiError(400, "Otp Is Required");
    }

    const userId = req.user._id

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const otpDoc = await Otp.findOne({
        email: user.email,
        purpose: "EMAIL_VERIFICATION"
    }).select("+otp");

    if(!otpDoc) {
        throw new ApiError(404, "Otp Not Found");
    }

    if(otpDoc.expireAt < Date.now()) {
        await Otp.deleteOne({_id: otpDoc._id});

        throw new ApiError(400, "Otp Is Expired");
    }

    if(otpDoc.attempts >= 5) {
        throw new ApiError(429, "Too Many Request")
    }

    const isOtpCorrect = await otpDoc.isOtpCorrect(otp);

    if(!isOtpCorrect) {
        otpDoc.attempts += 1;

        await otpDoc.save({validateBeforeSave: false});

        throw new ApiError(400, "Invalid Otp");
    }

    user.isEmailVerified = true;

    await user.save({validateBeforeSave: false});

    await Otp.deleteOne({_id: otpDoc._id});

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Email Verified Successfully"
        )
    )
})

export {
    verifyEmailOtp
}