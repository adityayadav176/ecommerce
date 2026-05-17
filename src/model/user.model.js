import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

userSchema.pre("save", async function() {
    if(!this.isModified("password")) return;

    const salt = bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            email = this.email,
            _id = this._id,
            mobileNo = this.mobileNo,
            fullname = this.fullname,
            role = this.role
        },
            process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }    
    )
}
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            email = this.email,
            _id = this._id,
            mobileNo = this.mobileNo,
            fullname = this.fullname,
            role = this.role
        },
            process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }    
    )
}

export const User = mongoose.model("User", userSchema)