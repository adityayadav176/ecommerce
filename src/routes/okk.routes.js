import { Router } from "express";
import { okkController } from "../controllers/everything.ok.controller.js";
import { verifyJwt} from "../middleware/auth.middleware.js"

const router = Router();

router.route("/okk").get(verifyJwt, okkController);
export default router;