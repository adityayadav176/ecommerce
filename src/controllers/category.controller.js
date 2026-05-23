import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { Category } from "../model/category.model.js"
import slugify from "slugify";
import { uploadOnCloudinary } from "../config/cloudinary.js";

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

})

const toggleIsActive = asyncHandler(async (req, res) => {

})

const changeCategoryImage = asyncHandler(async (req, res) => {

})

export {
    addCategory,
    updateCategory,
    toggleIsActive,
    changeCategoryImage
}