import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    reason: {
        type: String,
        required: true
    },

    refundAmount: {
        type: Number,
        required: true
    },

    refundStatus: {
        type: String,
        enum: [
            "Pending",
            "Approved",
            "Rejected",
            "Processed"
        ],
        default: "Pending"
    },

    refundMethod: {
        type: String,
        enum: [
            "Bank Transfer",
            "UPI",
            "Original Payment Method"
        ]
    },

    adminComment: {
        type: String
    }

}, { timestamps: true });

export const Refund = mongoose.model("Refund", refundSchema);