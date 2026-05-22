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

    const { title, description, size, price, stock, tags, category, brand, shippingCost, discountPrice, status, finalPrice } = req.body

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
        finalPrice: price,
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

const updateProductDetails = asyncHandler(async (req, res) => {

    const userId = req.user._id

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const {productId} = req.params

    if(!productId || !mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid ProductId");
    }

    const {title, description, size, price, tags, category, brand} = req.body

    if( title === undefined && description === undefined && size === undefined && price === undefined && tags === undefined &&  category === undefined && brand === undefined) {
        throw new ApiError(400, "At Least One Field Is Required For Update");
    }

    const existedProduct = await Product.findById(productId);

    if(!existedProduct) {
        throw new ApiError(404, "Product Not Found");
    }

     // ownership check
    if (existedProduct.createdBy.toString() !== userId.toString()) {
        throw new ApiError( 403, "You Can Update Only Your Product" );
    }

    if (title !== undefined) { 
        if ( typeof title !== "string" ||  title.trim().length < 3) {
            throw new ApiError(400, "Title Must Be At Least 3 Characters" );
        }
        existedProduct.title = title.trim();
    }

    if (description !== undefined) {
        if (typeof description !== "string" || description.trim().length < 10 ) {
            throw new ApiError( 400, "Description Must Be At Least 10 Characters" );
        }
        existedProduct.description = description.trim();
    }

      if (size !== undefined) {
        if (!Array.isArray(size)) {
             throw new ApiError( 400, "Size Must Be An Array" );
        }

        if (size.length === 0) {
             throw new ApiError( 400, "At Least One Size Is Required" );
        }
        existedProduct.size = size;
    }

     if (price !== undefined) {
        if ( typeof price !== "number" || price <= 0 ) {
            throw new ApiError( 400, "Price Must Be Greater Than 0" );
        }
           existedProduct.price = price;
    }

      if (tags !== undefined) {
        if (!Array.isArray(tags)) {
             throw new ApiError( 400, "Tags Must Be An Array" );
        }
        existedProduct.tags = tags;
    }

    if (category !== undefined) {
        if ( typeof category !== "string" || category.trim().length < 2 ) {
            throw new ApiError( 400, "Valid Category Is Required" );
        }
        existedProduct.category = category.trim().toLowerCase();
    }

     if (brand !== undefined) {
        if (typeof brand !== "string" || brand.trim().length < 2 ) {
            throw new ApiError( 400, "Valid Brand Is Required" );
        }
        existedProduct.brand = brand.trim().toLowerCase();
    }

    const shipping = existedProduct.shippingCost || 0;
    const discount = existedProduct.discountPrice || 0;

    existedProduct.finalPrice = existedProduct.price - discount + shipping;

     if (existedProduct.finalPrice < 0) {
        throw new ApiError( 400, "FinalPrice Cannot Be Negative" );
    }

    await existedProduct.save();

     return res.status(200).json(
        new ApiResponse( 200, existedProduct, "Product Updated Successfully" )
    );
})

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

    // fetch shipping cost
    const { shippingCost } = req.body;

    // validate shipping cost
    if (
        shippingCost === undefined ||
        typeof shippingCost !== "number" ||
        shippingCost < 0
    ) {
        throw new ApiError(
            400,
            "Valid ShippingCost Is Required"
        );
    }

    // fetch user id
    const userId = req.user?._id;

    // validate user
    if (!userId) {
        throw new ApiError(
            401,
            "Unauthorized Access Denied!"
        );
    }

    // fetch product id
    const { productId } = req.params;

    // validate product id
    if (
        !productId ||
        !mongoose.isValidObjectId(productId)
    ) {
        throw new ApiError(
            400,
            "Invalid ProductId"
        );
    }

    // find product
    const existedProduct = await Product.findById(productId);

    // validate product
    if (!existedProduct) {
        throw new ApiError(
            404,
            "Product Not Exists!"
        );
    }

    // ownership check
    if (
        existedProduct.createdBy.toString() !==
        userId.toString()
    ) {
        throw new ApiError(
            403,
            "You Can Update Only Your Product"
        );
    }

    // existing discount
    const discount =
        existedProduct.discountPrice || 0;

    // calculate final price
    const finalPrice =
        existedProduct.price
        - discount
        + shippingCost;

    // validate final price
    if (finalPrice < 0) {
        throw new ApiError(
            400,
            "FinalPrice Cannot Be Negative"
        );
    }

    // update product
    existedProduct.shippingCost = shippingCost;
    existedProduct.finalPrice = finalPrice;

    // save
    await existedProduct.save();

    // return response
    return res.status(200).json(
        new ApiResponse(
            200,
            existedProduct,
            "ShippingCost Updated Successfully"
        )
    );
});

const changeProductStatus = asyncHandler(async (req, res) => {
    const { status } = req.body

    if(!status) {
        throw new ApiError(400, "Status is Required To Be Changed");
    }

    const userId = req.user._id

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied!");
    }

    const {productId} = req.params

    if(!productId || !mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product Id");
    }

    const AllowedStatus = ["ACTIVE", "OUT_OF_STOCK", "DISCONTINUED"];

    if(!AllowedStatus.includes(status)) {
        throw new ApiError(400, "Invalid Status Value");
    }

    const existedProduct = await Product.findById(productId);

    if(!existedProduct) {
        throw new ApiError(404, "Product Not Found");
    }

    if(existedProduct.createdBy.toString() !== userId.toString()) {
        throw new ApiError(400, "You Are Not Allowed To Perform This Task");
    }

    if(existedProduct.status === status) {
        throw new ApiError(400, `Status Already ${status}`)
    }

    const updatedStatus = await Product.findByIdAndUpdate(
        productId,
        {
            $set: {
                status
            }
        },
        {
            new: true,
        },
    )

    if(!updatedStatus) {
        throw new ApiError(400, "Something Went Wrong While Updating Status");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedStatus, "Status Updated Successfully")
    )
})

const toggleIsPublished = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied!");
    }

    const {productId} = req.params

    if(!productId || !mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product Id");
    }

    const existedProduct = await Product.findById(productId);

    if(!existedProduct) {
        throw new ApiError(404, "Product Not Found");
    }

    if (existedProduct.createdBy.toString() !== userId.toString()) {
        throw new ApiError(403, "You Are Not Allowed To Perform This Task");
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
            $set: {
                isPublished: !existedProduct.isPublished
            },
        },
        {
            new: true
        }
    )

    if(!updatedProduct) {
        throw new ApiError(500, "Something Went Wrong While Updating Product PublishedStatus");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedProduct, `Product Is Now ${updatedProduct.isPublished === true ? "isPublished" : "UnPublished"}`)
    )
})

const addDiscountPrice = asyncHandler(async (req, res) => {

    // fetch user id
    const userId = req.user?._id;

    // validate user
    if (!userId) {
        throw new ApiError(
            401,
            "Unauthorized Access Denied"
        );
    }

    // fetch discount price
    const { discountPrice } = req.body;

    // validate discount price
    if (
        discountPrice === undefined ||
        typeof discountPrice !== "number" ||
        discountPrice < 0
    ) {
        throw new ApiError(
            400,
            "Valid DiscountPrice Is Required"
        );
    }

    // fetch product id
    const { productId } = req.params;

    // validate product id
    if (
        !productId ||
        !mongoose.isValidObjectId(productId)
    ) {
        throw new ApiError(
            400,
            "Invalid ProductId"
        );
    }

    // find product
    const existedProduct = await Product.findById(productId);

    // validate product
    if (!existedProduct) {
        throw new ApiError(
            404,
            "Product Not Found"
        );
    }

    // ownership check
    if (existedProduct.createdBy.toString() !== userId.toString()) {
        throw new ApiError( 403, "You Can Update Only Your Product" );
    }

    // existing shipping
    const shipping =
        existedProduct.shippingCost || 0;

    // calculate final price
    const finalPrice =
        existedProduct.price
        - discountPrice
        + shipping;

    // validate final price
    if (finalPrice < 0) {
        throw new ApiError(
            400,
            "DiscountPrice Is Greater Than Product Price"
        );
    }

    // update product
    existedProduct.discountPrice = discountPrice;
    existedProduct.finalPrice = finalPrice;

    // save product
    await existedProduct.save();

    // return response
    return res.status(200).json(
        new ApiResponse(
            200,
            existedProduct,
            "DiscountPrice Updated Successfully"
        )
    );
});

const updateStock = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const { productId } = req.params;

    if(!productId || !mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product Id");
    }

    const { stock } = req.body

     if (stock === undefined) {
        throw new ApiError(400, "Stock is required");
    }

    const existedProduct = await Product.findById(productId);

    if(!existedProduct) {
        throw new ApiError(404, "Product Not Found");
    }

    if(existedProduct.createdBy.toString() !== userId.toString()) {
        throw new ApiError(403, "You are Not Allowed To Perform This Task");
    }

    if(stock < 0) {
        throw new ApiError(400, "Required Must One Stock Item");
    }

    const updatedStock = await Product.findByIdAndUpdate(
        productId,
        {
            $set: {
                stock
            },
        },
        {
            new: true,
        }
    )

    if(!updateStock) {
        throw new ApiError(500, "Something Went Wrong While Updating Stock")
    }

    return res.
    status(200)
    .json(
        new ApiResponse(200, updatedStock ,"Stock Updated Successfully")
    )
})

// pending // pending // pending // pending // pending

const updateRating = asyncHandler(async (req, res) => {

})

const SoldAProduct = asyncHandler(async (req, res) => {

})

export {
    AddProduct,
    deleteProduct,
    getProductById,
    getAllProduct,
    getAllMyProducts,
    AddSippingCost,
    toggleIsPublished,
    changeProductStatus,
    addDiscountPrice,
    updateProductDetails,
    updateStock,
}