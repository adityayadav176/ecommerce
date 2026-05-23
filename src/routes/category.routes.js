import { Router } from "express";
import {verifyJwt} from "../middleware/auth.middleware.js"
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
import { addCategory } from "../controllers/category.controller.js";
const router = Router();


// router.route("/addCategory").post(verifyJwt, verifyAdmin, addCategory);
export default router;