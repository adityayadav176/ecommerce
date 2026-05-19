import mongoose from "mongoose";
import { User } from "../model/user.model.js";
import {uploadOnCloudinary} from "../config/cloudinary.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/ayncHandler.js"


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

const registerUser = asyncHandler(async(req, res)=> {
    // get user details req.body
    // validate details
    // check if user already exists
    // check images, avatar
    // upload them on cloudinary
    // create user objects 
    // remove password refresh token
    // check user creation 
    // return res

    const {fullName, email, password, mobileNo, role} = req.body || {}

    if(!fullName || !email || !password || !role) {
        throw new ApiError(400, "All Fields Are Required");
    }

    const existedUser = await User.findOne({
        $or: [{email}, {mobileNo}]
    }) 

    if(existedUser) {
        throw new ApiError(400, "User Already Exists");
    }

   const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const user = await User.create({
        fullName,
        email,
        mobileNo,
        password,
        role,
        avatar: avatar?.url
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser) {
        throw new ApiError(500, "Something Went Wrong While Creating User");
    }

    return res.json(
        new ApiResponse(200, createdUser, "User Register Successfully")
    )
})

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
        throw new ApiError(401, "Invalid User Credentials");
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

export {
    registerUser,
    loginUser
}