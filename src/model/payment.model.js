import mongoose, {Schema} from "mongoose";

const PaymentSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    paymentId: {
        type: String
    },
    paymentMethod: {
        type: String,
        enum: [
            "UPI",
            "CARD",
            "NET BANKING",
            "COD",
            "WALLET"
        ]
    },

      paymentStatus: {
        type: String,
        enum: [
            "Pending",
            "Success",
            "Failed",
            "Refunded"
        ],
        default: "Pending"
    },

    amount: {
        type: Number,
        required: true
    }

},{timestamps:true})