import mongoose from "mongoose";
import { Cart } from "../model/cart.model.js";
import { Order } from "../model/order.model.js";
import { Address } from "../model/address.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";

const createOrder = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const { addressId, paymentMethod } = req.body;

    if (!addressId || !mongoose.isValidObjectId(addressId)) {
        throw new ApiError(400, "Invalid Address Id");
    }

    const address = await Address.findOne({
        _id: addressId,
        user: userId
    });

    if (!address) {
        throw new ApiError(404, "Address Not Found");
    }

    const cart = await Cart.findOne({
        user: userId
    }).populate("items.product");

    if (!cart) {
        throw new ApiError(404, "Cart Not Found");
    }

    if (!cart.items.length) {
        throw new ApiError(400, "Cart Is Empty");
    }

    const orderItems = cart.items.map((item) => ({
        product: item.product._id,
        name: item.product.title,
        image: item.product.images?.[0] || "",
        price: item.priceAtPurchase,
        quantity: item.quantity
    }));

    const order = await Order.create({
        user: userId,
        orderItems,
        shippingAddress: address._id,
        totalPrice: cart.totalPrice,
        shippingPrice: 0,
        paymentMethod
    });

    if (!order) {
        throw new ApiError(500, "Failed To Create Order");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            order,
            "Order Created Successfully"
        )
    );
})

const getMyOrders = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const { status, paymentMethod} = req.query;

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

    if(!user) {
        throw new ApiError(404, "User not Found");
    }

    const order = await Order.findById(orderId)

    if (!order) {
        throw new ApiError(404, "Order Not Found");
    }

    if (order.user.toString() !== userId.toString()) {
        throw new ApiError(403,"You are not allowed to access this order");
    }

    return res.status(200)
    .json(
        new ApiResponse(200,order,"Order fetched successfully")
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
        throw new ApiError(403,"You are not allowed to cancel this order");
    }

    if (order.orderStatus === "DELIVERED" || order.orderStatus === "CANCELLED") {
        throw new ApiError(400,`Order already ${order.orderStatus}`);
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
        throw new ApiError(400,"Invalid Order Status");
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order Not Found");
    }

    if (order.orderStatus === "DELIVERED") {
        throw new ApiError(400,"Delivered order status cannot be changed");
    }

    order.orderStatus = orderStatus;

    await order.save();

    return res.status(200).json(
        new ApiResponse(200,order,"Order status updated successfully")
    );
});

export { 
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus
};