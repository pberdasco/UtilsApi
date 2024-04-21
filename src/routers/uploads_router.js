import { Router } from "express";
import UploadController from "../controllers/upload_controller.js";

export const uploadsRouter = Router();

uploadsRouter.post("/file", UploadController.uploadFile);
uploadsRouter.post("/base64", UploadController.uploadBase64);
uploadsRouter.get("/getfile/:filename", UploadController.getFile);
uploadsRouter.get("/delete/:filename", UploadController.deleteFile);


