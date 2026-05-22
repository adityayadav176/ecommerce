import { Router } from "express";
import { okkController } from "../controllers/everything.ok.controller.js";

const router = Router();

router.route("/okk").get(okkController);
export default router;