import mongoose from "mongoose";

const returnSchema = new mongoose.Schema({

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    returnReason: {
        type: String,
        required: true
    },

    returnStatus: {
        type: String,
        enum: [
            "Requested",
            "Pickup Scheduled",
            "Received",
            "Approved",
            "Rejected",
            "Refunded"
        ],
        default: "Requested"
    },

    pickupAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
    },

    images: [String]

}, { timestamps: true });

export const Return = mongoose.model("Return", returnSchema);