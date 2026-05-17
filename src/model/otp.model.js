import mongoose, {Schema} from "mongoose";
import bcrypt, { hash } from "bcrypt";

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
        ],
        required: true
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

// HASH OTP BEFORE SAVE
OtpSchema.pre("save", async function (next) {

  if (!this.isModified("otp")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);

  this.otp = await bcrypt.hash(this.otp, salt);

  next();
});
   
OtpSchema.methods.generateOtp = function() {
    let otp = '';
    for(let i = 0; i<6; i++){
        otp+= Math.floor(Math.random() * 10);
    }

    return otp;
}

OtpSchema.methods.isOtpCorrect = function() {
    return await bcrypt.compare(otp, this.otp)
}


export const Otp = mongoose.model("Otp", OtpSchema);