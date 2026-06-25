import mongoose, { Schema } from "mongoose";

const OrderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderItems: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        image: String,
        price: Number,
        quantity: Number,
      },
    ],

    shippingAddress: {
      type: Schema.Types.ObjectId,
      ref: "Address", 
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    shippingPrice: {
      type: Number,
      default: 0,
    },

    orderStatus: {
      type: String,
      enum: ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },

    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "FAILED"],
      default: "UNPAID",
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "RAZORPAY"],
      default: "RAZORPAY",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", OrderSchema);