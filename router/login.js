import userModel from "../model/userSchame.js";

import bcrypt from "bcrypt"; // Para hashear la contraseña
import jwt from "jsonwebtoken"; // Para generar tokens

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (email.trim() === "" || password.trim() === "") {
      return res.status(400).json({ msg: "Los campos no pueden estar vacíos" });
    }

    const usuario = await userModel.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ msg: "Usuario no encontrado" });
    }

    const passwordMatch = await bcrypt.compare(password, usuario.password);

    if (!passwordMatch) {
      return res.status(400).json({ msg: "Contraseña incorrecta" });
    }

    const tokens = jwt.sign(
      { id: usuario._id, email: usuario.email },
      process.env.CLave,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ msg: "Login exitoso", token: tokens });
  } catch (error) {
    console.error(error);
  }
};

export default login;
