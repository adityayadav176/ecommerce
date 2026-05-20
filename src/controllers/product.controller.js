import { Product } from "../model/product.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../config/cloudinary.js"
import mongoose, { mongo } from "mongoose"
import cloudinary from "cloudinary"

const AddProduct = asyncHandler(async (req, res) => {

    // fetched all important details from req.body
    // validate all details
    // fetched all images from req.files
    // validate images
    // upload on cloudinary
    // if not upload then return error
    // create product object according to all details and items
    // if error when creating a object then give error
    // fetched created product 
    // return res.json product and msg


    const userId = req.user._id
    if (!userId || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(401, "Unauthorized Access");
    }

    const { title, description, size, price, stock, tags, category, brand, shippingCost, discountPrice, status } = req.body

    if (!title || !description || !price || !stock || !tags || !category || !brand) {
        throw new ApiError(400, "ALL Fields Are Required!");
    }
    // images validation
    const imageFiles = req.files?.images;

    if (!imageFiles || imageFiles.length === 0) {
        throw new ApiError(400, "Product Images Are Required");
    }

    // upload multiple files
    const imageUrls = [];

    for (const file of imageFiles) {
        const uploadedImage = await uploadOnCloudinary(file.path);

        if (!uploadedImage?.url) {
            throw new ApiError(500, "Error while Uploading images!");
        }

        imageUrls.push({
            url: uploadedImage.secure_url,
            public_id: uploadedImage.public_id
        });
    }

    const stockNumber = Number(stock);

    const tagsArray = tags ? tags.split(",").map(tag => tag.trim()) : [];
    const sizeArray = size ? size.split(",").map(s => s.trim()) : [];

    if (isNaN(price) || isNaN(stock)) {
        throw new ApiError(400, "Prices and Stock must be A Numbers")
    }

    const product = await Product.create({
        title,
        description,
        tags: tagsArray,
        size: sizeArray,
        status: stockNumber === 0 ? "OUT_OF_STOCK" : "ACTIVE",
        images: imageUrls,
        price: Number(price),
        stock: stockNumber,
        category,
        brand,
        shippingCost: shippingCost || 0,
        discountPrice: discountPrice || 0,
        createdBy: req.user._id
    })

    if (!product) {
        throw new ApiError(500, "Something Went Wrong While Creating A Product!");
    }

    const createdProduct = await Product.findById(product._id).select("-__v")

    return res
        .status(201)
        .json(
            new ApiResponse(201, createdProduct, "Product Created Successfully")
        )

})

const deleteProduct = asyncHandler(async (req, res) => {
    const productId = req.params?.productId;

    if (!productId || !mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product Id");
    }

    const existedProduct = await Product.findById(productId)

    if (!existedProduct) {
        throw new ApiError(400, "Product Not Found");
    }

    const userId = req.user?._id
    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied!");
    }

    // DELETE ALL IMAGES FROM CLOUDINARY
    if(existedProduct.images && existedProduct.images.length > 0) {
        for (const img of existedProduct.images) {
            await cloudinary.uploader.destroy(img.public_id);
        }
    }

    await Product.findByIdAndDelete(productId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Product Deleted Successfully")
    );
});


export {
    AddProduct,
    deleteProduct
}