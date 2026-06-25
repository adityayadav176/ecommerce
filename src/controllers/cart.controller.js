import mongoose from "mongoose";
import { Cart } from "../model/cart.model.js";
import { Product } from "../model/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addToCart = asyncHandler(async (req, res) => {

    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized Access");
    }

    const { productId, quantity } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid ProductId");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new ApiError(400, "Invalid quantity");
    }

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (!product.isPublished) {
        throw new ApiError(400, "Product is not available");
    }

    let cart = await Cart.findOne({ user: userId });

    const price = product.finalPrice;

    // CREATE CART
    if (!cart) {

        cart = await Cart.create({
            user: userId,
            items: [
                {
                    product: productId,
                    quantity,
                    priceAtPurchase: price,
                    subtotal: price * quantity
                }
            ],
            totalItems: quantity,
            totalPrice: price * quantity
        });

        return res.status(201).json(
            new ApiResponse(201, cart, "Added to cart")
        );
    }

    // FIND ITEM
    const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId.toString()
    );

    const existingQty =
        itemIndex !== -1 ? cart.items[itemIndex].quantity : 0;

    const newQty = existingQty + quantity;

    if (product.stock < newQty) {
        throw new ApiError(400, "Insufficient stock");
    }

    // UPDATE ITEM
    if (itemIndex !== -1) {

        cart.items[itemIndex].quantity = newQty;
        cart.items[itemIndex].subtotal =
            newQty * price;

    } else {

        cart.items.push({
            product: productId,
            quantity,
            priceAtPurchase: price,
            subtotal: price * quantity
        });
    }

    // UPDATE TOTALS
    cart.totalItems = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.subtotal,
        0
    );

    await cart.save();

    return res.status(200).json(
        new ApiResponse(200, cart, "Cart updated successfully")
    );
});

const getCart = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const cart = await Cart.findOne({ user: userId })
        .populate({
            path: "items.product",
            select: "title finalPrice stock images"
        });

    if (!cart || cart.items.length === 0) {
        throw new ApiError(404, "Cart Not Found");
    }

    return res.status(200).json(
        new ApiResponse(200, cart, "Cart Fetched Successfully")
    );
});

const updateQuantity = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product Id");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new ApiError(400, "Quantity must be greater than 0");
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        throw new ApiError(404, "Cart Not Found");
    }

    const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
        throw new ApiError(404, "Product Not Found In Cart");
    }

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product Not Found");
    }

    // STOCK CHECK
    if (quantity > product.stock) {
        throw new ApiError(400,`Only ${product.stock} items available in stock`);
    }

    // Update item
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].subtotal =
        quantity * cart.items[itemIndex].priceAtPurchase;

    // Recalculate totals
    cart.totalItems = cart.items.reduce(
        (acc, item) => acc + item.quantity,
        0
    );

    cart.totalPrice = cart.items.reduce(
        (acc, item) => acc + item.subtotal,
        0
    );

    await cart.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            cart,
            "Product Quantity Updated Successfully"
        )
    );
});

const removePFromCart = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product Id");
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        throw new ApiError(404, "Cart Not Found");
    }

    const itemExists = cart.items.some(
        item => item.product.toString() === productId.toString()
    );

    if (!itemExists) {
        throw new ApiError(400, "Product Not Found In Cart");
    }

    // REMOVE ITEM
    cart.items = cart.items.filter(
        item => item.product.toString() !== productId.toString()
    );

    // RECALCULATE TOTALS
    cart.totalItems = cart.items.reduce(
        (acc, item) => acc + item.quantity,
        0
    );

    cart.totalPrice = cart.items.reduce(
        (acc, item) => acc + item.subtotal,
        0
    );

    await cart.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            cart,
            "Product Removed Successfully"
        )
    );
});

const clearCart = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const updatedCart = await Cart.findOneAndUpdate(
        { user: userId },
        {
            $set: {
                items: [],
                totalItems: 0,
                totalPrice: 0
            }
        },
        { new: true }
    );

    if (!updatedCart) {
        throw new ApiError(404, "Cart Not Found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedCart,
            "Cart Cleared Successfully"
        )
    );
});

export {
    addToCart,
    getCart,
    removePFromCart,
    clearCart,
    updateQuantity
}