import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { Category } from "../model/category.model.js"
import slugify from "slugify";
import { uploadOnCloudinary } from "../config/cloudinary.js";
import cloudinary from "cloudinary"
import { Product } from "../model/product.model.js";

const addCategory = asyncHandler(async (req, res) => {

    const { title, description, tags } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const imageLocalPath = req.files?.image?.[0]?.path;

    if (!imageLocalPath) {
        throw new ApiError(400, "Category image is required");
    }

    const uploadedImage = await uploadOnCloudinary(imageLocalPath);

    if (!uploadedImage?.url) {
        throw new ApiError(500, "Error while uploading image");
    }

    const existingCategory = await Category.findOne({
        title: title.toLowerCase()
    });

    if (existingCategory) {
        throw new ApiError(409, "Category already exists");
    }

    const category = await Category.create({
        title,
        slug: slugify(title, {
            lower: true,
            strict: true
        }),
        description,
        tags,
        image: {
            url: uploadedImage.url,
            public_id: uploadedImage.public_id
        }
    });

    if (!category) {
        throw new ApiError(500, "Failed to create category");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            category,
            "Category created successfully"
        )
    );
});

const updateCategory = asyncHandler(async (req, res) => {
    const { title,description, tags } = req.body
    
    if(!title || !description) {
        throw new ApiError(400, "Title And Description Are Required");
    }

    const {slug} = req.params

    if(!slug) {
        throw new ApiError(400, "Slug Are Required");
    }

    const updatedCategory = await Category.findOneAndUpdate(
        {slug},
        {
            title,
            description,
            tags,
            slug: slugify(title, {
            lower: true,
            strict: true
        }),
        },
        
        {
            new: true
        }
    )

    if(!updatedCategory) {
        throw new ApiError(500, "Internal Server Error While Updating Category");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedCategory, "Category Updated Successfully")
    )
})

const toggleIsActive = asyncHandler(async (req, res) => {
    const userId = req.user._id

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const {slug} = req.params

    if(!slug) {
        throw new ApiError(400, "Slug Is Required");
    }

    const category = await Category.findOne({slug});

    if(!category) {
        throw new ApiError(404, "Category Not Found");
    }

    category.isActive = !category.isActive;
    await category.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200, category, `Category is Now ${category.isActive === true ? "Accessible" : "Not Accessible"}`)
    )
})

const changeCategoryImage = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const { slug } = req.params;

    if (!slug) {
        throw new ApiError(400, "Slug Is Required");
    }

    const imageLocalPath = req.files?.image?.[0]?.path;

    if (!imageLocalPath) {
        throw new ApiError(400, "Image file is required");
    }

    const category = await Category.findOne({ slug });

    if (!category) {
        throw new ApiError(404, "Category Not Found");
    }

    // upload new image first (safer)
    const uploadResult = await uploadOnCloudinary(imageLocalPath);

    if (!uploadResult) {
        throw new ApiError(500, "Error while uploading image");
    }

    // delete old image AFTER successful upload
    if(category.image && category.image.length <= 0) {
        for(const img of category.image) {
            await cloudinary.uploader.destroy(img.public_id);
        }
    }

    category.image.url = uploadResult.secure_url;
    category.image.public_id = uploadResult.public_id;

    await category.save();

    return res.status(200).json(
        new ApiResponse(200, category, "Image Updated Successfully")
    );
});

const deleteCategoryBySlug = asyncHandler(async ( req, res) => {
    const userId = req.user?._id

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    const {slug} = req.params

    if(!slug) {
        throw new ApiError(400, "Slug Is Required");
    }

    const category = await Category.findOne({slug});

    if(!category) {
        throw new ApiError(404, "Category Not Found");
    }

    // delete image on cloudinary
    if(category.image && category.image.length <= 0) {
        for(const img of category.image) {
            await cloudinary.uploader.destroy(img.public_id);
        }
    }

    await Category.findOneAndDelete({slug});

    return res.status(200)
    .json(
        new ApiResponse(200, {}, "Category Deleted Successfully")
    )
    
})

const getCategoryProducts = asyncHandler(async (req, res) => {

    const { slug } = req.params;

    let { page, limit, search } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;

    const category = await Category.findOne({
        slug,
        isActive: true
    });

    if (!category) {
        throw new ApiError(404, "Category Not Found");
    }

    const filter = {
        category: category._id
    };

    if (search?.trim()) {
        filter.title = {
            $regex: search,
            $options: "i"
        };
    }

    const products = await Product.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            },
            "Products fetched successfully"
        )
    );
});

const getAllCategory = asyncHandler(async (req, res) => {

    let { page, limit, search } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const skip = (page - 1) * limit;

    const filter = {};

    if (search?.trim()) {
        filter.name = {
            $regex: search.trim(),
            $options: "i"
        };
    }

    const categories = await Category.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Category.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                categories,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                search: search || ""
            },
            "Categories fetched successfully"
        )
    );
});

const getCategoryStats = asyncHandler(async (req, res) => {

    const totalCategories = await Category.countDocuments();

    const activeCategories = await Category.countDocuments({
        isActive: true
    });

    const inactiveCategories = await Category.countDocuments({
        isActive: false
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalCategories,
                activeCategories,
                inactiveCategories
            },
            "Category statistics fetched successfully"
        )
    );
});

export {
    addCategory,
    updateCategory,
    toggleIsActive,
    changeCategoryImage,
    deleteCategoryBySlug,
    getAllCategory,
    getCategoryProducts,
    getCategoryStats
}