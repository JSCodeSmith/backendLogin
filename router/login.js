import userModel from "../model/userSchame.js";
import Usuario from "../model/Usuario.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ msg: "Los campos no pueden estar vacíos" });
    }

    // 1) Buscar en users
    let usuario = await userModel.findOne({ email });

    if (usuario) {
      // Login normal usando usuario.password
      const match = await bcrypt.compare(password, usuario.password);
      if (!match) return res.status(400).json({ msg: "Contraseña incorrecta" });

      const token = jwt.sign(
        {
          id: usuario._id,
          email: usuario.email,
          rol: usuario.rol || "Cliente",
        },
        process.env.CLave,
        { expiresIn: "1h" }
      );

      return res.json({
        msg: "Login exitoso",
        token,
        user: {
          id: usuario._id,
          username: usuario.username,
          email: usuario.email,
          rol: usuario.rol || "Cliente",
        },
      });
    }

    // 2) Buscar en colección 'usuarios'
    usuario = await Usuario.findOne({ correo: email });

    if (!usuario) {
      return res.status(400).json({ msg: "Usuario no encontrado" });
    }

    // AQUÍ ESTABA EL ERROR: usar usuario.contraseña
    const match = await bcrypt.compare(password, usuario.contraseña);
    if (!match) return res.status(400).json({ msg: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: usuario._id, email: usuario.correo, rol: usuario.rol || "Cliente" },
      process.env.CLave,
      { expiresIn: "1h" }
    );

    return res.json({
      msg: "Login exitoso",
      token,
      user: {
        id: usuario._id,
        username: usuario.nombre,
        email: usuario.correo,
        rol: usuario.rol || "Cliente",
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ msg: "Error del servidor" });
  }
};

export default login;
