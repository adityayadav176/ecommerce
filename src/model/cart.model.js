import mongoose, { Schema } from "mongoose";

const cartItemSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        priceAtPurchase: {
            type: Number,
            required: true
        },

        subtotal: {
            type: Number,
            required: true
        }
    },
    { _id: true }
);

const cartSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },

        items: [cartItemSchema],

        totalItems: {
            type: Number,
            default: 0
        },

        totalPrice: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

cartSchema.index({ user: 1 });

export const Cart = mongoose.model("Cart", cartSchema);