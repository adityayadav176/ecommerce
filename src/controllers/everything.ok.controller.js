import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const okkController = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
      new ApiResponse(200,{"data" : "Hello"}, "Your App Is Works")
    )
})

export {
    okkController
}