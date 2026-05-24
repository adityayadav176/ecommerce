import mongoose from "mongoose";
import { User } from "../model/user.model.js";
import { uploadOnCloudinary } from "../config/cloudinary.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { transporter } from "../config/nodemailer.config.js"
import cloudinary from "cloudinary"
import { Otp } from "../model/otp.model.js";


const generateAccessAndRefreshToken = async (userId) => {

    try {

        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();

        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({
            validateBeforeSave: false
        });

        return {
            accessToken,
            refreshToken
        };

    } catch (error) {

        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, mobileNo, role } = req.body || {};

    //  Validate input
    if (!fullName || !email || !password || !mobileNo) {
        throw new ApiError(400, "All required fields are missing");
    }

    //  Check existing user
    const existedUser = await User.findOne({
        $or: [{ email }, { mobileNo }]
    });

    if (existedUser) {
        throw new ApiError(400, "User already exists");
    }

    //  Handle avatar upload
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatarUpload = await uploadOnCloudinary(avatarLocalPath);

    if (!avatarUpload?.url || !avatarUpload?.public_id) {
        throw new ApiError(500, "Avatar upload failed");
    }

    //  Create user
    const user = await User.create({
        fullName,
        email,
        password,
        mobileNo,
        role: role || "Customer",
        avatar: {
            url: avatarUpload.url,
            public_id: avatarUpload.public_id
        }
    });

    //  Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    //  Clean response
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }

    //  Email
    await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: `Welcome to ${process.env.APP_NAME}`,
        text: `Hi ${fullName}, your account is successfully created.`
    }).catch(err => console.log("Email error:", err));

    //  Response
    return res.status(201).json(
        new ApiResponse(
            201,
            {
                user: createdUser,
                accessToken,
                refreshToken
            },
            "User registered successfully"
        )
    );
});

const loginUser = asyncHandler(async (req, res) => {

    const { email, mobileNo, password } = req.body;

    if ((!email && !mobileNo) || !password) {
        throw new ApiError(
            400,
            "Email or Mobile Number and Password are required"
        );
    }

    const user = await User.findOne({
        $or: [{ email }, { mobileNo }]
    });

    if (!user) {
        throw new ApiError(404, "User Not Found");
    }

    const isPasswordValid =
        await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid User Credentials");
    }

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User Logged In Successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User Logged Out Successfully")
        );
});

const updateFullName = asyncHandler(async (req, res) => {
    const { fullName } = req.body

    if (!fullName) {
        throw new ApiError(409, "FullName Are Required");
    }

    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const updatedFullName = await User.findByIdAndUpdate(
        userId,
        {
            fullName
        },
        {
            new: true
        }
    )

    if (!updatedFullName) {
        throw new ApiError(500, "Internal Server Error");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, updatedFullName, "FullName Updated Successfully")
        )
})

const updateProfilePicture = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    // multer file
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File Is Required");
    }

    // upload new image
    const uploadResult = await uploadOnCloudinary(avatarLocalPath);

    if (!uploadResult?.url || !uploadResult?.public_id) {
        throw new ApiError(500, "Error While Uploading Avatar");
    }

    // find user
    const user = await User.findById(userId)
        .select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User Not Found");
    }

    // delete old avatar from cloudinary
    if (user.avatar?.public_id) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    // update avatar
    user.avatar = {
        url: uploadResult.url,
        public_id: uploadResult.public_id
    };

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar Changed Successfully"
            )
        );
});

const updatePassword = asyncHandler(async (req, res) => {

    const userId = req.user._id

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const {password} = req.body

    if(!password) {
        throw new ApiError(400, "Password Is Required");
    }

    const user = await User.findById(userId);

    if(!user) {
        throw new ApiError(404, "User Not Found");
    }

    // update Password
})

const VerifyEmail = asyncHandler(async (req, res) => {

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
        expireAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // send email
    await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: "Verify Your Email",
        text: `Your OTP is ${otpCode}. It will expire in 10 minutes.`
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Verification OTP Sent Successfully"
        )
    );
});

const VerifyMobileNo = asyncHandler(async (req, res) => {

})

const generateRefreshToken = asyncHandler(async (req, res) => {

})

export {
    registerUser,
    loginUser,
    logoutUser,
    updatePassword,
    updateProfilePicture,
    updateFullName,
    VerifyEmail,
    generateRefreshToken,
    VerifyMobileNo
}