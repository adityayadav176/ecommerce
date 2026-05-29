import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    message: {
        type: String,
        required: true,
        trim: true
    },

    type: {
        type: String,
        enum: [
            "Order",
            "Refund",
            "Offer",
            "System"
        ],
        required: true
    },

    isRead: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);