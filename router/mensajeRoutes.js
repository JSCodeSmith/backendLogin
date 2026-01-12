import express from "express";
import { addMessage, getMessages } from "../controllers/mensajeController.js";

const router = express.Router();

router.post("/", addMessage);
router.get("/:from/:to", getMessages);

export default router;
