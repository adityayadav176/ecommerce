import { Otp } from "../model/otp.model.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";
import { transporter } from "../config/nodemailer.config.js"

const SendVerificationEmailOtp = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const user = await User.findById(userId)
        .select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User Not Found");
    }

    // already verified
    if (user.isEmailVerified) {
        throw new ApiError(400, "Email Already Verified");
    }

    // generate otp
    const otpCode = Math.floor(
        100000 + Math.random() * 900000
    ).toString();

    // delete previous otp
    await Otp.deleteMany({
        email: user.email,
        purpose: "EMAIL_VERIFICATION"
    });

    // save otp
    await Otp.create({
        email: user.email,
        otp: otpCode,
        purpose: "EMAIL_VERIFICATION",
        expireAt: new Date(Date.now() + 2 * 60 * 1000)
    });

    // send email
    await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: "Verify Your Email",
        text: `Your OTP is ${otpCode}. It will expire in 2 minutes.`
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Verification OTP Sent Successfully"
        )
    );
});

const sendPasswordResetOtp = asyncHandler(async (req, res) => {

const { email } = req.body;

if (!email) {
    throw new ApiError(
        400,
        "Email is required"
    );
}

const user = await User.findOne({ email });

if (!user) {
    throw new ApiError(
        404,
        "User not found"
    );
}

if (!user.isEmailVerified) {
    throw new ApiError(
        400,
        "Please verify your email first"
    );
}

const otpCode = Math.floor(
    100000 + Math.random() * 900000
).toString();

await Otp.deleteMany({
    email,
    purpose: "FORGET_PASSWORD",
});

await Otp.create({
    email,
    otp: otpCode,
    purpose: "FORGET_PASSWORD",
    expireAt: new Date(
        Date.now() + 2 * 60 * 1000
    ),
});

await transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to: email,
    subject: "Password Reset OTP",
    html: `
        <div style="font-family:sans-serif">
            <h2>Password Reset OTP</h2>
            <p>Your OTP is:</p>
            <h1>${otpCode}</h1>
            <p>This OTP expires in 2 minutes.</p>
        </div>
    `,
});

return res.status(200).json(
    new ApiResponse(
        200,
        {},
        "Password Reset OTP Sent Successfully"
    )
);
});


export {
    sendPasswordResetOtp,
    SendVerificationEmailOtp
}