import { Router } from "express";
import ExcelController from "../controllers/excel_controller.js";

export const excelRouter = Router();

excelRouter.get("/sheet/:file/:firstfield?", ExcelController.getSheet);
excelRouter.post("/upload", ExcelController.upload);


