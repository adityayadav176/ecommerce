import mongoose, {Schema} from "mongoose";

const couponSchema = new Schema({
    code: {
        type: String,
        unique: true,
        uppercase: true,
        required: true,
        trim: true
    },

    description: {
        type: String,
    },

    discountType: {
        type: String,
        enum: ["Flat", "Percentage"],
        required: true
    },

    discountValue: {
        type: Number,
        required: true
    },

    minimumOrderAmount: {
        type: Number,
        default: 0
    },

    maximumDiscountAmount: {
        type: Number,
        default: 1
    },

    usageLimit: {
        type: Number,
        default: 0
    },

    applicableUser: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    applicableProducts: [
        {
            type: Schema.Types.ObjectId,
            ref: "Product"
        }
    ],

    expiryDate: {
        type: Date,
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    usageLimit: {
        type: Number,
        default: 1
    },
},{timestamps: true})


export const Coupon = mongoose.model("Coupon", couponSchema);