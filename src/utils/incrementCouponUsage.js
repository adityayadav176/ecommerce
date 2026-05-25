import { Coupon } from "../model/coupon.model"
import { ApiError } from "./ApiError";

const incrementCouponUsage = async (couponId) => {
    const coupon = await Coupon.findByIdAndUpdate(
        couponId,
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
        throw new ApiError(404, "Coupon Not Found");
    }

    return coupon;
}

export {
    incrementCouponUsage
}