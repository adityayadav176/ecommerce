import { Address } from "../model/address.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const CreateAddress = asyncHandler(async (req, res) => {
   try {
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
   } catch (error) {
    throw new ApiError(500, "Internal Server Error");
   }
})

const updateAddress = asyncHandler(async (req, res) => {

   try {
     // fetch user id
     const userId = req.user?._id;
 
     // validate user
     if (!userId) {
         throw new ApiError(
             401,
             "Unauthorized Access Denied"
         );
     }
 
     // fetch all fields
     const {
         addressType,
         city,
         state,
         country,
         pinCode,
         landmark,
         houseNo
     } = req.body;
 
     // check at least one field
     if (
         addressType === undefined &&
         city === undefined &&
         state === undefined &&
         country === undefined &&
         pinCode === undefined &&
         landmark === undefined &&
         houseNo === undefined
     ) {
         throw new ApiError(
             400,
             "At Least One Field Is Required To Update"
         );
     }
 
     // fetch address id
     const { addressId } = req.params;
 
     // validate address id
     if (
         !addressId ||
         !mongoose.isValidObjectId(addressId)
     ) {
         throw new ApiError(
             400,
             "Invalid AddressId"
         );
     }
 
     // allowed types
     const allowedAddressTypes = [
         "HOME",
         "WORK",
         "OTHER"
     ];
 
     // validate address type
     if (
         addressType !== undefined &&
         !allowedAddressTypes.includes(addressType)
     ) {
         throw new ApiError(
             400,
             "Invalid AddressType"
         );
     }
 
     // validate pin code
     if (
         pinCode !== undefined &&
         !/^\d{6}$/.test(pinCode)
     ) {
         throw new ApiError(
             400,
             "Invalid Indian PIN Code"
         );
     }
 
     // find address
     const existedAddress =
         await Address.findById(addressId);
 
     // validate address
     if (!existedAddress) {
         throw new ApiError(
             404,
             "Address Not Found"
         );
     }
 
     // ownership check
     if (
         existedAddress.user.toString() !==
         userId.toString()
     ) {
         throw new ApiError(
             403,
             "You Can Update Only Your Address"
         );
     }
 
     // update fields
     if (addressType !== undefined) {
         existedAddress.addressType =
             addressType;
     }
 
     if (city !== undefined) {
         existedAddress.city = city.trim();
     }
 
     if (state !== undefined) {
         existedAddress.state = state.trim();
     }
 
     if (country !== undefined) {
         existedAddress.country =
             country.trim();
     }
 
     if (pinCode !== undefined) {
         existedAddress.pinCode = pinCode;
     }
 
     if (landmark !== undefined) {
         existedAddress.landmark =
             landmark.trim();
     }
 
     if (houseNo !== undefined) {
         existedAddress.houseNo =
             houseNo.trim();
     }
 
     // save
     await existedAddress.save();
 
     // return response
     return res.status(200).json(
         new ApiResponse(
             200,
             existedAddress,
             "Address Updated Successfully"
         )
     );
   } catch (error) {
    throw new ApiError(500, "Internal Server Error");
   }
});

const changeIsDefault = asyncHandler(async (req, res) => {
   try {
     const userId = req.user?._id
 
     if(!userId) {
         throw new ApiError(401, "Unauthorized Access Denied");
     }
 
     const {addressId} = req.params
 
     if(!addressId || !mongoose.isValidObjectId(addressId)) {
         throw new ApiError(400, "Invalid AddressId");
     }
 
     const existedAddress = await Address.findById(addressId);
 
     if(!existedAddress) {
         throw new ApiError(404, "Address Not Found");
     }
 
     if (existedAddress.user.toString() !== userId.toString()) {
             throw new ApiError(403, "You Are Not Allowed To Perform This Task");
     }
 
     const newAddress = await Address.findByIdAndUpdate(
         addressId,
         {
             $set: {
                 isDefault: !existedAddress.isDefault
             },
         },
         {
             new: true
         }
     )
 
    if(!newAddress) {
            throw new ApiError(500, "Something Went Wrong While Updating address ChangeIsDefault");
     }
 
    return res
    .status(200)
    .json(
     new ApiResponse(200, newAddress, `Address is now ${!existedAddress.isDefault ? "default" : "not default"}`)
    )
   } catch (error) {
    throw new ApiError(500, "internal Server Error");
   }
})

export {
    CreateAddress,
    updateAddress,
    changeIsDefault,
}