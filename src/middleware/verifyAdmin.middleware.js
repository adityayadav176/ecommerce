import { ApiError } from "../utils/ApiError.js";

export const verifyAdmin = (req, _ , next) => {
    if(req.user?.role !== "Admin") {
        throw new ApiError(403, "Only Admin Can Access This Route")
    }
    next();
}

