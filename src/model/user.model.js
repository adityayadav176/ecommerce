import mongoose, {Schema} from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    mobileNo: {
        type: Number,
        unique: true,
        required: true,
        match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"]
    },
    password: {
        type: String,
        required: true
    },
    profilePic: {
        type: String
    },
    role: {
        enum: ['Admin', 'Customer'],
        default: "Customer"
    },
    refreshToken: {
        type: String
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    }
},{timestamps: true})

export const User = mongoose.model("User", userSchema)