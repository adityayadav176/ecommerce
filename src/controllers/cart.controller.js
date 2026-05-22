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

const getCart = asyncHandler(async (req, res) => {
    const userId = req.user._id

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const cart = await Cart.aggregate([
        {
            $match: {
                user: userId
            },
        },
        {
            $lookup: {
                from: "items",
                localField: "product",
                foreignField: "_id",
                as: "products"
            }
        }
    ])
    
    if(!cart) {
        throw new ApiError(404, "Cart Not Found");
    }

    return res.status(200)
    .json(
        new ApiResponse(200, cart, "Cart Fetched Successfully")
    )
})

const updateQuantity = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate Product Id
    if (!productId || !mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product Id");
    }

    // Validate Quantity
    if (quantity === undefined || quantity < 1) {
        throw new ApiError(400, "Quantity must be greater than 0");
    }

    // Find Cart
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        throw new ApiError(404, "Cart Not Found");
    }

    // Find Product Inside Cart
    const cartProduct = cart.items.find(
        (item) => item.product.toString() === productId
    );

    if (!cartProduct) {
        throw new ApiError(404, "Product Not Found In Cart");
    }

    // Check Product Stock
    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product Not Found");
    }

    if (quantity > product.stock) {
        throw new ApiError(
            400,
            `Only ${product.stock} items available in stock`
        );
    }
    cartProduct.subtotal = cartProduct.priceAtPurchase * quantity;
    // Update Quantity
    cartProduct.quantity = quantity;

    // Update Total Price
    cart.totalPrice = cart.items.reduce((acc, item) => {
        return acc + item.subtotal;
    }, 0);

    // Update Total Products
     cart.totalItems = cart.items.reduce((acc, item) => {
        return acc + item.quantity;
    }, 0);

    await cart.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            cart,
            "Product Quantity Updated Successfully"
        )
    );
});

const removePFromCart = asyncHandler(async(req, res) => {
    const userId = req.user?._id

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const {productId} = req.params

    if(!productId || !mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product Id");
    }

    const cart = await Cart.findOne({user: userId});

    if(!cart) {
        throw new ApiError(404, "Cart Not Found");
    }

    const product = await Product.findById(productId);

     if(!product) {
        throw new ApiError(404, "Product Not Found");
    }

    const cartProduct = cart.items.find((item) => item.product.toString() === productId)

    if(!cartProduct) {
        throw new ApiError(400, "Product Not Found In Cart");
    }

    const updatedCart = await Cart.findOneAndUpdate(
        {user: userId},
        {
            $pull: {
                items: {
                    product: productId
                }
            }
        },
        {
            new: true
        }
    )

    updatedCart.totalItems = updatedCart.items.reduce(
        (acc, item) => acc + item.quantity,
        0
    )

    updatedCart.totalPrice = updatedCart.items.reduce(
        (acc, item) =>acc + (item.finalPrice * item.quantity),
        0
    )

    await updatedCart.save();

    if(!updatedCart) {
        throw new ApiError(500, "Something Went Wrong While Updating Cart");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedCart, "Product Deleted Successfully")
    )
})

const clearCart = asyncHandler(async (req, res) => {
    const userId = req.user._id

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const cart = await Cart.findOne({user : userId});

    if(!cart) {
        throw new ApiError(404, "Cart Not Found");
    }

    if(cart.items.length === 0) {
        throw new ApiError(400, "Cart Already Empty");
    }

    while(cart.items.length !== 0) {
        cart.items.pop()
    }

    cart.totalItems = 0;
    cart.totalPrice = 0;

    await cart.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200, cart, "Cart Clear Successfully")
    )

})


export {
    addToCart,
    getCart,
    removePFromCart,
    clearCart,
    updateQuantity
}