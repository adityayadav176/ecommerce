import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const OtpSchema = new Schema(
    {
        email: {
            type: String,
            lowercase: true,
            trim: true,
            sparse: true
        },

        mobileNo: {
            type: Number,
            sparse: true
        },

        otp: {
            type: String,
            required: true,
            select: false,
        },

        attempts: {
            type: Number,
            default: 0,
        },

        purpose: {
            type: String,
            enum: [
                "REGISTER",
                "LOGIN",
                "FORGET_PASSWORD",
                "2FA",
                "EMAIL_VERIFICATION",
            ],
            required: true,
        },

        expireAt: {
            type: Date,
            required: true,
        },

        verified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// OTP HASH 
OtpSchema.pre("save", async function (next) {
    if (!this.isModified("otp")) return next();

    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);

    next();
});

//  OTP CHECK METHOD 
OtpSchema.methods.isOtpCorrect = async function (enteredOtp) {
    return await bcrypt.compare(enteredOtp, this.otp);
};

//  TTL AUTO DELETE 
OtpSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model("Otp", OtpSchema);