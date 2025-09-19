import express from "express";
import registrarUsuario from "./registrarUsuario.js";
import login from "./login.js";

const router = express.Router();

router.post("/register", registrarUsuario);

router.post("/login", login);

export default router;
