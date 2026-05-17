import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    title: {
        type: String
    },

    message: {
        type: String
    },

    type: {
        type: String,
        enum: [
            "Order",
            "Refund",
            "Offer",
            "System"
        ]
    },

    isRead: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);