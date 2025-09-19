import userModel from "../model/userSchame.js";

import bcrypt from "bcrypt"; // Para hashear la contraseña

// Registrar usuario
const registrarUsuario = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // 1️⃣ Validar campos vacíos
    if (
      !email ||
      !password ||
      !username ||
      email.trim() === "" ||
      password.trim() === "" ||
      username.trim() === ""
    ) {
      return res.status(400).json({ msg: "Los campos no pueden estar vacíos" });
    }

    // 2️⃣ Verificar si el usuario ya existe
    const usuarioExistente = await userModel.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ msg: "El usuario ya existe" });
    }

    // 3️⃣ Hashear la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4️⃣ Crear instancia del usuario
    const nuevoUsuario = new userModel({
      email,
      password: passwordHash,
      username,
      createdAt: new Date(),
    });

    // 5️⃣ Guardar en MongoDB
    await nuevoUsuario.save();

    // 6️⃣ Responder al cliente
    return res.status(200).json({ msg: "Usuario registrado correctamente" });
  } catch (error) {
    console.error(error);
  }
};

export default registrarUsuario;
