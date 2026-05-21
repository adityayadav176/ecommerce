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
    if (existedProduct.images && existedProduct.images.length > 0) {
        for (const img of existedProduct.images) {
            await cloudinary.uploader.destroy(img.public_id);
        }
    }

    await Product.findByIdAndDelete(productId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Product Deleted Successfully")
    );
});

const getProductById = asyncHandler(async (req, res) => {
    const userId = req.user._id

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied!");
    }
    const productId = req.params.productId

    if (!productId || !mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product Id");
    }

    const product = await Product.findById(productId).sort({ createdAt: -1 });

    if (!product) {
        throw new ApiError(404, "Not Found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, product, "Product Fetched Successfully")
        );
});

const getAllProduct = asyncHandler(async (req, res) => {

    const filter = {
        isPublished: true,
        status: { $ne: "DISCONTINUED" }
    };

    const products = await Product.find(filter).sort({ createdAt: -1 });

    const totalProducts = await Product.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalProducts,
                products
            },
            "Fetched All Products Successfully"
        )
    );
});

const getAllMyProducts = asyncHandler(async (req, res) => {

    // get logged in user id
    const userId = req.user?._id;

    // check authorization
    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied!");
    }

    // aggregate products
    const products = await Product.aggregate([

        // fetch only logged in user products
        {
            $match: {
                createdBy: new mongoose.Types.ObjectId(userId)
            }
        },

        // add final price field
        {
            $addFields: {
                finalPrice: {
                    $add: [
                        "$price",
                        {
                            $ifNull: ["$shippingCost", 0]
                        }
                    ]
                }
            }
        },

        // remove discontinued products
        {
            $match: {
                status: {
                    $ne: "DISCONTINUED"
                }
            }
        },

        // sort latest products first
        {
            $sort: {
                createdAt: -1
            }
        },

        // calculate totals
        {
            $group: {
                _id: null,

                totalProducts: {
                    $sum: 1
                },

                totalStock: {
                    $sum: "$stock"
                },

                totalPrice: {
                    $sum: "$finalPrice"
                },

                products: {
                    $push: "$$ROOT"
                }
            }
        }

    ]);

    // if no products
    if (!products.length) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    totalProducts: 0,
                    totalStock: 0,
                    totalPrice: 0,
                    products: []
                },
                "No Products Found"
            )
        );
    }

    // return response
    return res.status(200).json(
        new ApiResponse(
            200,
            products[0],
            "Products Fetched Successfully"
        )
    );
});

const AddSippingCost = asyncHandler(async (req, res) => {
    const { shippingCost } = req.body

    if (shippingCost === undefined || !shippingCost) {
        throw new ApiError(400, "Shipping Cost Is Required!");
    }

    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied!");
    }

    const { productId } = req.params;

    if (!productId || !mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid ProductId");
    }

    const existedProduct = await Product.findById(productId);

    if (!existedProduct) {
        throw new ApiError(404, "Product Not Exists!");
    }

    if (existedProduct.createdBy.toString() !== userId.toString()) {
        throw new ApiError(403, "You Can Update Only Your Product");
    }

    const finalPrice = existedProduct.price + shippingCost;

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
            $set: {
                shippingCost,
                price: finalPrice
            },
        },
        {
            new: true,
        }
    );

    if (!updatedProduct) {
        throw new ApiError(500, "Something Went Wrong While Updating ShippingCost");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedProduct, "Shipping Cost Updated Successfully")
        )
})

export {
    AddProduct,
    deleteProduct,
    getProductById,
    getAllProduct,
    getAllMyProducts,
    AddSippingCost
}