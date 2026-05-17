import mongoose, { Schema } from "mongoose";

const cartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                default: 1,
                required: true,
                min: 1
            }
        }
    ],
    totalPrice: {
        type: Number,
        default: 0
    },
    priceAtPurchase: {
        type: Number,
        required: true,
    }
}, { timestamps: true })

export const Cart = mongoose.model("Cart", cartSchema);