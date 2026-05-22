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

    if (!productId) {
        throw new ApiError(400, "ProductId is required");
    }

    if (!mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid ProductId");
    }

    if (!quantity || quantity < 1) {
        throw new ApiError(400, "Quantity must be greater than 0");
    }

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.stock < quantity) {
        throw new ApiError(400, "Insufficient stock");
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {

        cart = await Cart.create({
            user: userId,

            items: [
                {
                    product: productId,
                    quantity,
                    priceAtPurchase: product.finalPrice,
                    subtotal: product.finalPrice * quantity
                }
            ]
        });
    }

    else {

        const existingProductIndex = cart.items.findIndex(
            item => item.product.toString() === productId.toString()
        );

        // PRODUCT EXISTS
        if (existingProductIndex !== -1) {

            cart.items[existingProductIndex].quantity += quantity;

            cart.items[existingProductIndex].subtotal =
                cart.items[existingProductIndex].quantity *
                cart.items[existingProductIndex].priceAtPurchase;
        }

        // NEW PRODUCT
        else {

            cart.items.push({
                product: productId,
                quantity,
                priceAtPurchase: product.finalPrice,
                subtotal: product.finalPrice * quantity
            });
        }

        await cart.save();
    }

    cart.totalItems = cart.items.reduce(
        (acc, item) => acc + item.quantity,
        0
    );

    cart.totalPrice = cart.items.reduce(
        (acc, item) => acc + item.subtotal,
        0
    );

    await cart.save();

    const updatedCart = await Cart.aggregate([

        {
            $match: {
                user: new mongoose.Types.ObjectId(userId)
            }
        },

        {
            $unwind: "$items"
        },

        {
            $lookup: {
                from: "products",
                localField: "items.product",
                foreignField: "_id",
                as: "product"
            }
        },

        {
            $unwind: "$product"
        },

        {
            $project: {

                _id: 1,

                totalItems: 1,

                totalPrice: 1,

                item: {

                    itemId: "$items._id",

                    quantity: "$items.quantity",

                    subtotal: "$items.subtotal",

                    product: {
                        _id: "$product._id",
                        title: "$product.title",
                        price: "$product.finalPrice",
                        stock: "$product.stock",

                        thumbnail: {
                            $arrayElemAt: [
                                "$product.images.url",
                                0
                            ]
                        }
                    }
                }
            }
        },

        {
            $group: {

                _id: "$_id",

                totalItems: {
                    $first: "$totalItems"
                },

                totalPrice: {
                    $first: "$totalPrice"
                },

                items: {
                    $push: "$item"
                }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedCart[0],
            "Product added to cart successfully"
        )
    );
});


export {
    addToCart
}