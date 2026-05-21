import mongoose, {Schema} from "mongoose";

const addressSchema = new Schema({
    addressType: {
        type: String,
        enum: ["HOME", "WORK", "OTHER"],
        required: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    pinCode: {
        type: String,
        required: true,
        trim: true,
        match: [/^\d{6}$/, "Invalid PIN Code"]
    },
    landmark: {
        type: String,
        required: true,
        trim: true
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    houseNo: {
        type: String
    },
    isDefault: {
        type: Boolean,
        default: false
    }
},{timestamps: true})

export const Address = mongoose.model("Address", addressSchema);