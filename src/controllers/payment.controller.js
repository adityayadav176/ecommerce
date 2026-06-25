import crypto from "crypto";
import mongoose from "mongoose";
import { Payment } from "../model/payment.model.js";
import { Order } from "../model/order.model.js";
import { Cart } from "../model/cart.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../model/product.model.js";

const verifyPayment = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    const {razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId} = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError(400, "Payment details missing");
    }

    
    //  IDEMPOTENCY CHECK 
    const existingPayment = await Payment.findOne({ razorpay_order_id, paymentStatus: "SUCCESS" });

    if (existingPayment?.paymentStatus === "SUCCESS") {
        return res.status(200).json(
            new ApiResponse(200, {}, "Payment already verified (idempotent)")
        );
    }

    // VERIFY SIGNATURE
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body)
        .digest("hex");

    //   FAILED CASE
    if (expectedSignature !== razorpay_signature) {

        await Payment.findOneAndUpdate(
            { razorpay_order_id },
            {
                razorpay_payment_id,
                razorpay_signature,
                paymentStatus: "FAILED"
            }
        );

        await Order.findByIdAndUpdate(orderId, {
            paymentStatus: "FAILED",
            orderStatus: "PENDING"
        });

        throw new ApiError(400, "Payment verification failed");
    }

    //  SUCCESS CASE

    await Payment.findOneAndUpdate(
        { razorpay_order_id },
        {
            razorpay_payment_id,
            razorpay_signature,
            paymentStatus: "SUCCESS"
        }
    );

    const order = await Order.findByIdAndUpdate(
        orderId,
        {
            paymentStatus: "PAID",
            orderStatus: "PROCESSING"
        },
        { new: true }
    );

    for (const item of order.orderItems) {

    await Product.findByIdAndUpdate(
        item.product,
        {
            $inc: {
                stock: -item.quantity
            }
        }
    );

    }
    
    if (!order) {
        throw new ApiError(404, "Order Not Found");
    }

    await Cart.findOneAndUpdate(
        { user: userId },
        {
            $set: {
                items: [],
                totalPrice: 0,
                totalItems: 0
            }
        }
    );

    return res.status(200).json(
        new ApiResponse(200, order, "Payment Verified Successfully")
    );
});

export {
    verifyPayment
}