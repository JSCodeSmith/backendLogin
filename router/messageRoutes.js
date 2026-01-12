import { Router } from "express";
import {
  sendMessage,
  getAllMessages,
} from "../controllers/messageController.js";

const router = Router();

// 📤 Enviar un mensaje
router.post("/addmsg", sendMessage);

// 📥 Obtener historial de mensajes entre dos usuarios
router.post("/getmsg", getAllMessages);

export default router;
