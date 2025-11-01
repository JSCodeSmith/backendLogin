import bcrypt from "bcrypt";
import userModel from "../model/userSchame.js"; // asegúrate que este path es correcto

// Controlador para registrar un usuario
const registrarUsuario = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // 1️⃣ Normaliza el campo "name" (acepta name o username)
    const finalName = name || username;
    if (!finalName || finalName.trim() === "") {
      return res.status(400).json({ error: "El campo 'name' es obligatorio" });
    }

    // 2️⃣ Verifica campos requeridos
    if (!email || email.trim() === "" || !password || password.trim() === "") {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    // 3️⃣ Comprueba si ya existe el usuario
    const existe = await userModel.findOne({ email });
    if (existe) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // 4️⃣ Hashea la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Crea el nuevo usuario
    const nuevoUsuario = new userModel({
      name: finalName, // 🔥 aquí se garantiza que 'name' siempre existe
      email,
      password: hashedPassword,
    });

    // 6️⃣ Guarda en la base de datos
    await nuevoUsuario.save();

    // 7️⃣ Respuesta
    return res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario: {
        id: nuevoUsuario._id,
        name: nuevoUsuario.name,
        email: nuevoUsuario.email,
      },
    });
  } catch (error) {
    console.error("Error en registrarUsuario:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

export default registrarUsuario;
