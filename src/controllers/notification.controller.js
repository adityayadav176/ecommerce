import mongoose from "mongoose";
import { Notification } from "../model/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createNotification = asyncHandler(async (req, res) => {
    const { title, message, type } = req.body;

    if ([title, message, type].some((item) => item == null || item == undefined || item.trim() === "")) {
        throw new ApiError(400, "Title, Message and Type are required");
    }

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const newNotification = await Notification.create({
        user: userId,
        title,
        message,
        type
    });

    if (!newNotification) {
        throw new ApiError(
            500,
            "Internal Server Error While Creating Notification"
        );
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            newNotification,
            "New Notification Created"
        )
    );
});

const updateNotification = asyncHandler(async (req, res) => {
    const { title, message, type } = req.body;

    if ([title, message, type].some((item) => item == null || item == undefined || item.trim() === "")) {
        throw new ApiError(400, "Title, Message and Type are required");
    }

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const { notificationId } = req.params;

    if (!notificationId || !mongoose.isValidObjectId(notificationId)) {
        throw new ApiError(400, "Invalid Notification Id");
    }

    const existingNotification =
        await Notification.findByIdAndUpdate(
            notificationId,
            {
                title,
                message,
                type
            },
            {
                new: true,
                runValidators: true
            }
        );

    if (!existingNotification) {
        throw new ApiError(
            404,
            "Notification Not Found Or Not Updated"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            existingNotification,
            "Notification Updated Successfully"
        )
    );
});

const deleteNotification = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const { notificationId } = req.params;

    if (!notificationId || !mongoose.isValidObjectId(notificationId)) {
        throw new ApiError(400, "Invalid Notification Id");
    }

    const deletedNotification = await Notification.findByIdAndDelete(notificationId);

    if (!deletedNotification) {
        throw new ApiError(
            404,
            "Notification Not Found Or Already Deleted"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Notification Deleted Successfully"
        )
    );
});

export {
    createNotification,
    updateNotification,
    deleteNotification
};