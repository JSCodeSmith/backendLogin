import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../model/Usuario.js";

const loginAdmin = async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    const admin = await Usuario.findOne({ correo });

    if (!admin || admin.rol !== "Administrador") {
      return res
        .status(403)
        .json({ msg: "No tienes permisos de administrador" });
    }

    const passwordOK = await bcrypt.compare(contraseña, admin.contraseña);
    if (!passwordOK)
      return res.status(400).json({ msg: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: admin._id, rol: admin.rol },
      process.env.CLave,
      { expiresIn: "2h" }
    );

    res.json({
      msg: "Login de administrador exitoso",
      token,
      admin: {
        id: admin._id,
        nombre: admin.nombre,
        rol: admin.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

export default loginAdmin;
