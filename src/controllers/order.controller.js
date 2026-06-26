import mongoose from "mongoose";
import { Order } from "../model/order.model.js"; // Adjust paths accordingly
import { Payment } from "../model/payment.model.js";
import { Cart } from "../model/cart.model.js";
import { Address } from "../model/address.model.js";
import { Product } from "../model/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { razorpay } from "../config/razorpay.js"; 

const createOrder = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized Access Denied");

    const { addressId, paymentMethod } = req.body;
    if (!addressId || !mongoose.isValidObjectId(addressId)) {
        throw new ApiError(400, "Invalid Address Id");
    }

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) throw new ApiError(404, "Cart Is Empty");

    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) throw new ApiError(404, "Address Not Found");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const orderItems = [];
        let totalPrice = 0;

        for (const item of cart.items) {
            const product = await Product.findById(item.product._id).session(session);
            if (!product || product.stock < item.quantity) {
                throw new ApiError(400, `Product ${product?.title || "Unknown"} is out of stock.`);
            }
            const subtotal = item.priceAtPurchase * item.quantity;
            totalPrice += subtotal;

            orderItems.push({
                product: item.product._id,
                name: item.product.title,
                image: item.product.images?.[0]?.url || "",
                price: item.priceAtPurchase,
                quantity: item.quantity,
            });
        }

        // Find or update the order
        let order = await Order.findOne({
            user: userId,
            paymentStatus: "UNPAID",
            orderStatus: "PENDING",
            paymentMethod: "RAZORPAY"
        }).session(session);

        if (order) {
            order.orderItems = orderItems; 
            order.totalPrice = totalPrice;
            order.shippingAddress = address._id;
            await order.save({ session });
        } else {
            const [newOrder] = await Order.create(
                [{
                    user: userId,
                    orderItems,
                    shippingAddress: address._id,
                    totalPrice,
                    shippingPrice: 0,
                    paymentMethod,
                    orderStatus: "PENDING",
                    paymentStatus: "UNPAID",
                }],
                { session }
            );
            order = newOrder;
        }

        if (paymentMethod === "COD") {
            for (const item of orderItems) {
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } }, { session });
            }
            await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { session });
            await session.commitTransaction();
            session.endSession();
            return res.status(201).json(new ApiResponse(201, { order }, "Order Placed via COD"));
        }

        
        // PREVENT MULTI-CLICK RACE CONDITION
        // Check if a payment token was created for this order within the last 1 minute
        const oneMinuteAgo = new Date(Date.now() - 60000);
        let existingPayment = await Payment.findOne({
            order: order._id,
            paymentStatus: "CREATED",
            createdAt: { $gte: oneMinuteAgo }
        }).session(session);

        if (existingPayment) {
            // A request just ran a split-second ago! Re-use the existing active payment intent.
            await session.commitTransaction();
            session.endSession();

            return res.status(200).json(
                new ApiResponse(
                    200, 
                    { 
                        order, 
                        razorpayOrder: { id: existingPayment.razorpay_order_id, amount: existingPayment.amount, currency: existingPayment.currency }, 
                        payment: existingPayment 
                    }, 
                    "Payment intent pulled from active session (Double-click caught)"
                )
            );
        }

        // Proceed normally if no rapid duplicate exists
        const amountInPaise = Math.round(totalPrice * 100);
        let razorpayOrder;
        
        try {
            razorpayOrder = await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: `order_rcpt_${order._id.toString()}`,
            });
        } catch (razorError) {
            throw new ApiError(502, `Razorpay Gateway Error: ${razorError.message}`);
        }

        const [payment] = await Payment.create(
            [{
                user: userId,
                order: order._id,
                razorpay_order_id: razorpayOrder.id,
                amount: amountInPaise,
                currency: "INR",
                paymentStatus: "CREATED",
            }],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json(
            new ApiResponse(201, { order, razorpayOrder, payment }, "Payment window initialized")
        );

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

const getMyOrders = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const { status, paymentMethod } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: userId };

    if (status) {
        filter.orderStatus = status;
    }

    if (paymentMethod) {
        filter.paymentMethod = paymentMethod;
    }

    const [orders, totalOrders] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("orderItems totalPrice orderStatus paymentStatus createdAt")
            .populate("orderItems.product", "title images price")
            .populate("user", "name email")
            .lean(),

        Order.countDocuments({ user: userId })
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orders,
                page,
                limit,
                totalOrders,
                totalPages: Math.ceil(totalOrders / limit)
            },
            "Orders fetched successfully"
        )
    );
});

const getOrderById = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { orderId } = req.params;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    if (!mongoose.isValidObjectId(orderId)) {
        throw new ApiError(400, "Invalid Order Id");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not Found");
    }

    const order = await Order.findById(orderId)

    if (!order) {
        throw new ApiError(404, "Order Not Found");
    }

    if (order.user.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not allowed to access this order");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, order, "Order fetched successfully")
        );
});

const cancelOrder = asyncHandler(async (req, res) => {

    const userId = req.user?._id;
    const { orderId } = req.params;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    if (!mongoose.isValidObjectId(orderId)) {
        throw new ApiError(400, "Invalid Order Id");
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order Not Found");
    }

    if (order.user.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not allowed to cancel this order");
    }

    if (order.orderStatus === "DELIVERED" || order.orderStatus === "CANCELLED") {
        throw new ApiError(400, `Order already ${order.orderStatus}`);
    }

    order.orderStatus = "CANCELLED";

    await order.save();

    return res.status(200).json(
        new ApiResponse(200, order, "Order cancelled successfully")
    );
});

const updateOrderStatus = asyncHandler(async (req, res) => {

    const { orderId } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
        throw new ApiError(400, "Invalid Order Id");
    }

    const allowedStatuses = [
        "PENDING",
        "PAID",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED"
    ];

    if (!allowedStatuses.includes(orderStatus)) {
        throw new ApiError(400, "Invalid Order Status");
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order Not Found");
    }

    if (order.orderStatus === "DELIVERED") {
        throw new ApiError(400, "Delivered order status cannot be changed");
    }

    order.orderStatus = orderStatus;

    await order.save();

    return res.status(200).json(
        new ApiResponse(200, order, "Order status updated successfully")
    );
});

export {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus
};