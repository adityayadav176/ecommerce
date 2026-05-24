import { Otp } from "../model/otp.model.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";

const verifyEmailOtp = asyncHandler(async (req, res) => {

    const { email, otp } = req.body;

    // validation
    if (!email || !otp) {
        throw new ApiError(
            400,
            "Email and OTP Required"
        );
    }

    // check user
    const existingUser = await User.findOne({ email })
        .select("-password -refreshToken");

    if (!existingUser) {
        throw new ApiError(
            404,
            "User Not Found"
        );
    }

    // already verified
    if (existingUser.isEmailVerified) {
        throw new ApiError(
            400,
            "Email Already Verified"
        );
    }

    // find otp
    const otpDoc = await Otp.findOne({
        email,
        purpose: "EMAIL_VERIFICATION"
    }).select("+otp");

    if (!otpDoc) {
        throw new ApiError(
            404,
            "OTP Not Found"
        );
    }

    // expiry check
    if (otpDoc.expireAt < Date.now()) {

        await Otp.deleteOne({
            _id: otpDoc._id
        });

        throw new ApiError(
            400,
            "OTP Expired"
        );
    }

    // max attempts
    if (otpDoc.attempts >= 5) {

        await Otp.deleteOne({
            _id: otpDoc._id
        });

        throw new ApiError(
            429,
            "Too Many Attempts"
        );
    }

    // compare otp
    const isOtpCorrect =
        await otpDoc.isOtpCorrect(otp);

    if (!isOtpCorrect) {

        // increment attempts
        await Otp.updateOne(
            { _id: otpDoc._id },
            {
                $inc: {
                    attempts: 1
                }
            }
        );

        throw new ApiError(
            400,
            "Invalid OTP"
        );
    }

    // verify user
    const verifiedUser =
        await User.findOneAndUpdate(
            { email },
            {
                isEmailVerified: true
            },
            {
                new: true
            }
        ).select("-password -refreshToken");

    // delete otp after success
    await Otp.deleteOne({
        _id: otpDoc._id
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                verifiedUser,
                "Email Verified Successfully"
            )
        );
});

export {
    verifyEmailOtp
}