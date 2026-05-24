import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
    },

    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT", "FREE_SHIPPING"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
    },

    minCartValue: {
      type: Number,
      default: 0,
    },

    totalQuantity: {
      type: Number,
      required: true,
      default: 100, // e.g. only 100 users can use this coupon
    },

    usedQuantity: {
      type: Number,
      default: 0,
    },

    perUserLimit: {
      type: Number,
      default: 1, // each user can use 1 time
    },

    isStackable: {
      type: Boolean,
      default: false,
    },

    expireAt: {
        type: Date,
        required: true
    },

    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
export {
    Coupon
};