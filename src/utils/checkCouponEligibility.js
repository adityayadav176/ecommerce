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

    const normalizedCode =
        couponCode.trim().toUpperCase();

    const coupon = await Coupon.findOne({
        code: normalizedCode
    });

    // Coupon Exists
    if (!coupon) {
        throw new ApiError(
            404,
            "Coupon Not Found"
        );
    }

    // Coupon Active
    if (!coupon.isActive) {
        throw new ApiError(
            400,
            "Coupon Is Invalid Or Inactive"
        );
    }

    // Expiry Validation
    if (coupon.expireAt < Date.now()) {
        throw new ApiError(
            400,
            "Coupon Expired"
        );
    }

    // Total Usage Validation
    if (
        coupon.usedQuantity >=
        coupon.totalQuantity
    ) {
        throw new ApiError(
            400,
            "Coupon Usage Limit Reached"
        );
    }

    // Minimum Cart Value Validation
    if (
        cartTotal < coupon.minCartValue
    ) {
        throw new ApiError(
            400,
            `Minimum Cart Value Should Be ${coupon.minCartValue}`
        );
    }

    // Product Eligibility Validation
    if (
        coupon.applicableProducts.length > 0
    ) {

        const isValidProduct =
            productIds.some(productId =>
                coupon.applicableProducts.some(
                    applicableProduct =>
                        applicableProduct.toString() ===
                        productId.toString()
                )
            );

        if (!isValidProduct) {
            throw new ApiError(
                400,
                "Coupon Not Applicable For These Products"
            );
        }
    }

    // Category Eligibility Validation
    if (
        coupon.applicableCategories.length > 0
    ) {

        const isValidCategory =
            categoryIds.some(categoryId =>
                coupon.applicableCategories.some(
                    applicableCategory =>
                        applicableCategory.toString() ===
                        categoryId.toString()
                )
            );

        if (!isValidCategory) {
            throw new ApiError(
                400,
                "Coupon Not Applicable For These Categories"
            );
        }
    }

    // Per User Limit Validation
    const userCouponUsage =
        await Order.countDocuments({
            user: userId,
            coupon: coupon._id
        });

    if (
        userCouponUsage >=
        coupon.perUserLimit
    ) {
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