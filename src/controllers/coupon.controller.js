import { Coupon } from "../model/coupon.model.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createCoupon = asyncHandler(async (req, res) => {
    const {
        description,
        code,
        discountType,
        discountValue,
        totalQuantity,
        perUserLimit,
        applicableProducts,
        applicableCategories,
        expireAt,
        minCartValue
    } = req.body;

    // Required validation
    if (
        [description, code, discountType, discountValue, totalQuantity, perUserLimit, expireAt]
            .some(item => item === undefined || item === null || item === "")
    ) {
        throw new ApiError(400, "All Fields Are Required");
    }

    const userId = req?.user?._id

    if (!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }

    // Validate arrays
    if (!Array.isArray(applicableCategories) || !Array.isArray(applicableProducts)) {
        throw new ApiError(400, "Invalid Categories or Products Format");
    }

    // Discount type validation
    if (!["PERCENTAGE", "FLAT", "FREE_SHIPPING"].includes(discountType)) {
        throw new ApiError(400, "Invalid Discount Type");
    }

    // Discount value validation
    if (discountType !== "FREE_SHIPPING" && discountValue <= 0) {
        throw new ApiError(400, "Discount Value Must Be Greater Than 0");
    }

    // Quantity validation
    if (totalQuantity <= 0) {
        throw new ApiError(400, "Quantity Must Be Greater Than 0");
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check duplicate
    const existingCoupon = await Coupon.findOne({ code: normalizedCode });
    if (existingCoupon) {
        throw new ApiError(409, "Coupon Already Exists");
    }

    // Expiry validation
    if (new Date(expireAt).getTime() < Date.now()) {
        throw new ApiError(400, "Coupon Already Expired");
    }

    const coupon = await Coupon.create({
        code: normalizedCode,
        description: description.trim(),
        discountType,
        discountValue,
        totalQuantity,
        perUserLimit,
        applicableCategories,
        applicableProducts,
        expireAt,
        minCartValue
    });

    return res.status(201).json(
        new ApiResponse(201, coupon, "Coupon Created Successfully")
    );
});

const getAllCoupons = asyncHandler(async (req, res) => {
    const { page, limit, isActive, code } = req.query;

    const query = {};

    // filter active/inactive
    if (isActive !== undefined) {
        query.isActive = isActive === "true";
    }

    // search by coupon code
    if (code) {
        query.code = { $regex: code, $options: "i" };
    }

    // pagination safe values
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const coupons = await Coupon.find(query)
        .populate("applicableCategories", "name")
        .populate("applicableProducts", "name price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const totalCoupons = await Coupon.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                coupons,
                pagination: {
                    totalCoupons: totalCoupons,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalCoupons / limitNum),
                },
            },
            "Coupons fetched successfully"
        )
    );
});

const getCouponsById = asyncHandler(async (req, res) => {
    const { couponId } = req.params

    if (!couponId || !mongoose.isValidObjectId(couponId)) {
        throw new ApiError(400, "Invalid Coupon Id");
    }

    const coupon = await Coupon.findById(couponId)
        .populate("applicableCategories", "name")
        .populate("applicableProducts", "name price");


    if (!coupon) {
        throw new ApiError(404, "Coupon Not Found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, coupon, "Coupon Fetched Successfully")
        )
})

const deleteCoupons = asyncHandler(async (req, res) => {

})

const applyCoupon = asyncHandler(async (req, res) => {

})

const IncrementCouponUsage = asyncHandler(async (Req, res) => {

})

const checkCouponEligibility = asyncHandler(async (req, res) => {

})

const updateCoupon = asyncHandler(async (req, res) => {

})

export {
    createCoupon,
    getAllCoupons,
    getCouponsById
}