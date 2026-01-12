import express from "express";
import {
  getUsuario,
  logOut,
  setAvatar,
} from "../controllers/userController.js";
import Usuario from "../model/Usuario.js";
const router = express.Router();

router.get("/:userId/info", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await Usuario.findById(userId).select(
      "username email avatarImage role createdAt"
    );

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      _id: user._id,
      username: user.username || user.email.split("@")[0],
      email: user.email,
      avatarImage: user.avatarImage || "",
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Error al obtener información del usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/avatar/:id", setAvatar);
router.post("/logout/:id", logOut);

export default router;
