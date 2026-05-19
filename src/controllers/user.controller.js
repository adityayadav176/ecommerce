import mongoose from "mongoose";
import { User } from "../model/user.model.js";
import {uploadOnCloudinary} from "../config/cloudinary.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/ayncHandler.js"

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

export {
    registerUser
}