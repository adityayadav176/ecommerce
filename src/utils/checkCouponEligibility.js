import { Coupon } from "../model/coupon.model.js";
import { Order } from "../model/order.model.js";
import { ApiError } from "./ApiError.js";

const checkCouponEligibility = async ({
    couponCode,
    userId,
    cartTotal,
    productIds = [],
    categoryIds = []
}) => {

    const normalizedCode = couponCode.trim().toUpperCase();

    const coupon = await Coupon.findOne({
        code: normalizedCode
    });

    if (!coupon) {
        throw new ApiError(404, "Coupon Not Found");
    }

    if (!coupon.isActive) {
        throw new ApiError(400, "Coupon Is Invalid Or Inactive");
    }

    if (new Date() > coupon.expireAt) {
        throw new ApiError(400, "Coupon Expired");
    }

    if (coupon.usedQuantity >= coupon.totalQuantity) {
        throw new ApiError(400, "Coupon Usage Limit Reached");
    }

    if (cartTotal < coupon.minCartValue) {
        throw new ApiError(
            400,
            `Minimum Cart Value Should Be ${coupon.minCartValue}`
        );
    }

    // Product Eligibility Validation
    if (coupon.applicableProducts?.length > 0) {

        const applicableProducts = new Set(
            coupon.applicableProducts.map(id => id.toString())
        );

        const isValidProduct = productIds.some(
            productId => applicableProducts.has(productId.toString())
        );

        if (!isValidProduct) {
            throw new ApiError(
                400,
                "Coupon Not Applicable For These Products"
            );
        }
    }

    // Category Eligibility Validation
    if (coupon.applicableCategories?.length > 0) {

        const applicableCategories = new Set(
            coupon.applicableCategories.map(id => id.toString())
        );

        const isValidCategory = categoryIds.some(
            categoryId => applicableCategories.has(categoryId.toString())
        );

        if (!isValidCategory) {
            throw new ApiError(
                400,
                "Coupon Not Applicable For These Categories"
            );
        }
    }

    const userCouponUsage = await Order.countDocuments({
        user: userId,
        coupon: coupon._id
    });

    if (userCouponUsage >= coupon.perUserLimit) {
        throw new ApiError(
            400,
            "Per User Coupon Limit Reached"
        );
    }

    return coupon;
};

export {
    checkCouponEligibility
};