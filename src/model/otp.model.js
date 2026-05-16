import mongoose, {Schema} from "mongoose";

const OtpSchema = new Schema({
    email: {
        type: String
    },
    mobileNo: {
        type: String
    },

    otp: {
        type: String,
        required: true
    },

    purpose: {
        type: String,
        enum: [
            "REGISTER",
            "LOGIN",
            "FORGET_PASSWORD",
            "2FA",
            "EMAILVERIFICATION",
        ]
    },

    expireAt: {
        type: Date,
        required: true
    },

    verified: {
        type: Boolean,
        default: false
    }
},{timestamps: true})

export const Otp = mongoose.model("Otp", OtpSchema);