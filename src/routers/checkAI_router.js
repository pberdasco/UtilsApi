import { Router } from "express";
import CheckAIController from "../controllers/checkAI_controller.js";

export const checkAIRouter = Router();

checkAIRouter.get("/:filename", CheckAIController.factura);


