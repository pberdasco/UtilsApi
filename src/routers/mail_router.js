import { Router } from "express";
import MailController from "../controllers/mail_controller.js";

export const mailRouter = Router();

mailRouter.post("/send", MailController.send);



