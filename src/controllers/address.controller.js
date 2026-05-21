import { Address } from "../model/address.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const CreateAddress = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if(!userId) {
        throw new ApiError(401, "Unauthorized Access Denied");
    }
    
    const {addressType, city, state, country, pinCode, landmark, houseNo} = req.body

    if(!addressType || !city || !state || !country || !pinCode || !landmark || !houseNo) {
        throw new ApiError(400, "All Fields Are Required");
    }

    const allowedAddressTypes = ["HOME", "WORK", "OTHER"];

    if(!allowedAddressTypes.includes(addressType)) {
        throw new ApiError(400, "Invalid AddressType");
    }

    if (!/^\d{6}$/.test(pinCode)) {
        throw new ApiError( 400, "Invalid Indian PIN Code" );
    } 

    const newAddress = await Address.create({
        addressType,
        city,
        state: state.trim(),
        country: country.trim(),
        pinCode,
        landmark: landmark.trim(),
        houseNo: houseNo.trim(),
        user: userId
    })

    if(!newAddress) {
        throw new ApiError(500, "Something Went Wrong While Creating Address");
    }

    return res.
    status(201)
    .json(
        new ApiResponse(201, newAddress, "Address Created Successfully")
    )
})

export {
    CreateAddress,
}