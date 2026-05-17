import mongoose, {Schema} from "mongoose";

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderItems: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: Number,

            name: String,

            image: String,

            price: Number
        }
    ],
    shippingAddress: {
        type: Schema.Types.ObjectId,
        ref: "Address",
        required: true
    },
    orderStatus: {
        type: String,
        enum : [
            "Pending",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled"
        ],
        default: "Pending"
    },
    deliveredAt: Date,

    totalPrice: {
        type: Number,
        required: true
    },
    shippingPrice: {
        type: Number,
        default: 0
    },
    paymentInfo: {
        id: String,
        status: String
    },
    paidAt: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ["COD", "UPI", "Card", "Net Banking"]
    }
},{timestamps: true})

export const Order = mongoose.model("Order", orderSchema);