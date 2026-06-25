import { Product } from "../model/product.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../config/cloudinary.js"
import cloudinary from "cloudinary"
import mongoose from "mongoose"

const AddProduct = asyncHandler(async (req, res) => {

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

    if (isNaN(price) || isNaN(stockNumber)) {
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

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = {
        isPublished: true,
        status: { $ne: "DISCONTINUED" }
    };

    const [products, totalProducts] = await Promise.all([

        Product.aggregate([
            { $match: filter },

            { $sort: { createdAt: -1 } },

            { $skip: skip },

            { $limit: limit },

            {
                $project: {
                    title: 1,
                    price: 1,
                    finalPrice: 1,
                    discountPrice: 1,
                    rating: 1,
                    stock: 1,
                    brand: 1,
                    status: 1,

                    thumbnail: {
                        $arrayElemAt: ["$images", 0]
                    }
                }
            }
        ]),

        Product.countDocuments(filter)

    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    hasNextPage: page * limit < totalProducts,
                    hasPrevPage: page > 1
                }
            },
            "Products fetched successfully"
        )
    );
});

const getAllMyProducts = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied!");
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const matchStage = {
        createdBy: new mongoose.Types.ObjectId(userId),
        status: { $ne: "DISCONTINUED" }
    };

    const [products, stats] = await Promise.all([

        Product.aggregate([
            {
                $match: matchStage
            },
            {
                $project: {
                    title: 1,
                    price: 1,
                    stock: 1,
                    brand: 1,
                    status: 1,
                    rating: 1,
                    createdAt: 1,
                    finalPrice: {
                        $add: [
                            "$price",
                            { $ifNull: ["$shippingCost", 0] }
                        ]
                    },
                    thumbnail: {
                        $arrayElemAt: ["$images", 0]
                    }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]),

        Product.aggregate([
            {
                $match: matchStage
            },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalStock: { $sum: "$stock" },
                    totalPrice: {
                        $sum: {
                            $add: [
                                "$price",
                                { $ifNull: ["$shippingCost", 0] }
                            ]
                        }
                    }
                }
            }
        ])

    ]);

    const summary = stats[0] || {
        totalProducts: 0,
        totalStock: 0,
        totalPrice: 0
    };

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                ...summary,
                page,
                limit,
                totalPages: Math.ceil(summary.totalProducts / limit),
                products
            },
            "Products Fetched Successfully"
        )
    );
});

const AddSippingCost = asyncHandler(async (req, res) => {
    const { shippingCost } = req.body;

    if (shippingCost === undefined ||typeof shippingCost !== "number" ||shippingCost < 0) {
        throw new ApiError(
            400,
            "Valid ShippingCost Is Required"
        );
    }


    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(
            401,
            "Unauthorized Access Denied!"
        );
    }


    const { productId } = req.params;

   
    if (!productId ||!mongoose.isValidObjectId(productId)) {
        throw new ApiError(
            400,
            "Invalid ProductId"
        );
    }

    
    const existedProduct = await Product.findById(productId);

    if (!existedProduct) {
        throw new ApiError(
            404,
            "Product Not Exists!"
        );
    }

    if (existedProduct.createdBy.toString() !== userId.toString()) {
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

const updateRating = asyncHandler(async (req, res) => {

    const userId = req.user?._id;
    const { productId } = req.params;
    const { rating } = req.body;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access");
    }

    if (!mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product ID");
    }

    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const existingRating = product.ratings.find(
        (item) => item.user.toString() === userId.toString()
    );

    if (existingRating) {
        existingRating.rating = rating;
    } else {
        product.ratings.push({
            user: userId,
            rating
        });
    }

    const totalRatings = product.ratings.reduce(
        (sum, item) => sum + item.rating,
        0
    );

    product.averageRating =
        totalRatings / product.ratings.length;

    await product.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            product,
            "Rating updated successfully"
        )
    );
});

const getProductRatings = asyncHandler(async (req, res) => {

    const { productId } = req.params;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);

    if (!mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Product ID");
    }

    const product = await Product.findById(productId)
        .select("ratings averageRating")
        .populate("ratings.user", "fullName username avatar");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const totalRatings = product.ratings.length;
    const totalPages = Math.ceil(totalRatings / limit);
    const skip = (page - 1) * limit;

    const paginatedRatings = product.ratings.slice(
        skip,
        skip + limit
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                averageRating: product.averageRating,
                totalRatings,
                currentPage: page,
                totalPages,
                ratings: paginatedRatings
            },
            "Ratings fetched successfully"
        )
    );
});

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
    updateRating,
    getProductRatings
}