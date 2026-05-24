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

const getAllCoupons = asyncHandler(async (Req, res) => {

})

const getCouponsById = asyncHandler(async (req, res) => {

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
    createCoupon
}