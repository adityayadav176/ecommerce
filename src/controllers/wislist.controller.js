import { Wishlist } from "../model/wishlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../model/product.model.js"
import mongoose from "mongoose";

const addToWisList = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const { productId } = req.params;


    if (
        !productId ||
        !mongoose.Types.ObjectId.isValid(productId)
    ) {
        throw new ApiError(400, "Invalid Product Id");
    }


    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product Not Found");
    }

    let wishlist = await Wishlist.findOne({
        user: userId
    });


    if (!wishlist) {

        wishlist = await Wishlist.create({

            user: userId,

            products: [productId]
        });
    }

    else {

        const alreadyExists =
            wishlist.products.includes(productId);

        if (alreadyExists) {

            throw new ApiError(
                400,
                "Product already exists in wishlist"
            );
        }

        wishlist.products.push(productId);

        await wishlist.save();
    }

    wishlist = await Wishlist.findById(wishlist._id)
    .populate({
        path: "products",
        select: "title finalPrice images"
    });

    return res.status(201).json(

        new ApiResponse(
            201,
            wishlist,
            "Product added to wishlist successfully"
        )
    );
});

const deleteProductToWishlist = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const {productId} = req.params

    if(!productId || !mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product Id");
    }

    const product = await Product.findById(productId);

    if(!product) {
        throw new ApiError(404, "Product Not Found");
    }

    const wishlist = await Wishlist.findOne({user: userId})

    if(!wishlist) {
        throw new ApiError(404, "Wishlist Not Found");
    }

    await Wishlist.findOneAndUpdate(
        {
            user: userId,
        },
        {
            $pull: {
                products: productId
            }
        },
        {new: true}
    )

    await wishlist.save();

    return res.status(200)
    .json(
        new ApiResponse(200, {}, "Product Deleted Successfully")
    )
})

export {
    addToWisList,
    deleteProductToWishlist
}