import mongoose from "mongoose";
import { Notification } from "../model/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createNotification = asyncHandler((req, res) => {
    const { title, message, type } = req.body

    if ([title, message, type].some(item => item == null || item == undefined || item == "")) {
        throw new ApiError(400, "Title Message And Type Are Required");
    }

    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const NewNotification = await Notification.create({
        title,
        message,
        type
    })

    if (!NewNotification) {
        throw new ApiError(500, "Internal Server Error While Creating Notification");
    }

    return res.status(201)
        .json(
            new ApiResponse(201, NewNotification, "New Notification Created")
        )
});



export {
    createNotification
}