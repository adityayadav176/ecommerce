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



const updateNotification = asyncHandler((req, res) => {
    const {title, message, type} = req.body

    if([title, message, type].some(item => item == null || item == undefined || item == ""));

    const userId = req.user._id;

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const notificationId = req.params;

    if(!notificationId || !mongoose.isValidObjectId(notificationId)) {
        throw new ApiError(400, "Invalid Notification Id");
    }

    const ExistingNotification = await Notification.findByIdAndUpdate(
        notificationId,
        {
            title,
            message,
            type
        },
        {
            new: true
        }
    )

    if(!ExistingNotification) {
        throw new ApiError(404, "Notification Not Found Or Updated");
    }

    return res.status(200)
    .json(
        new ApiResponse(200, ExistingNotification, "Notification Updated Successfully")
    )
})

const deleteNotification = asyncHandler((req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const { NotificationId } = req.params;

    if (!NotificationId || !mongoose.isValidObjectId(notificationId)) {
        throw new ApiError(404, "Notification Not Found");
    }

    const deletedNotification = Notification.findByIdAndDelete(NotificationId);

    if (!deleteNotification) {
        throw new ApiError(404, "Notification Not Found Or Deleted");
    }

    return res.status(200)
    .json(
        new ApiResponse(200, {}, "Notification Deleted Successfully")
    )
});

export {
    createNotification,
    updateNotification,
    deleteNotification
}