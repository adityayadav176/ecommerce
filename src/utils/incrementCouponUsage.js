import { Coupon } from "../model/coupon.model.js"
import { ApiError } from "./ApiError.js";

const incrementCouponUsage = async (couponId) => {

    const coupon = await Coupon.findOneAndUpdate(
        {
            _id: couponId,
            $expr: {
                $lt: ["$usedQuantity", "$totalQuantity"]
            }
        },
        {
            $inc: {
                usedQuantity: 1
            }
        },
        {
            new: true
        }
    );

    if (!coupon) {
        throw new ApiError(
            400,
            "Coupon Usage Limit Reached"
        );
    }

    return coupon;
};

export {
    incrementCouponUsage
}