import { Router } from "express";
import { CreateAddress } from "../controllers/address.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router()


router.route("/createAddress").post(verifyJwt ,CreateAddress);
export default router;