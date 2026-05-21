import { Router } from "express";
import { changeIsDefault, CreateAddress, updateAddress } from "../controllers/address.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router()


router.route("/createAddress").post(verifyJwt ,CreateAddress);
router.route("/updateAddress/:addressId").patch(verifyJwt, updateAddress);
router.route("/changeIsDefault/:addressId").patch(verifyJwt, changeIsDefault);
export default router;