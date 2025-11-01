import Usuario from "../model/Usuario.js";
import bcrypt from "bcrypt";

const nuevoUsuario = async (req, res) => {
  try {
    let { nombre, correo, contraseña, rol, estado } = req.body;

    // LIMPIEZA DE STRINGS
    nombre = nombre?.trim();
    correo = correo?.trim();
    rol = rol?.trim();
    estado = estado?.trim();

    // VALIDACIONES BÁSICAS
    if (!nombre || !correo || !contraseña || !rol || !estado) {
      return res
        .status(400)
        .json({ mensaje: "Todos los campos son obligatorios" });
    }

    // VALIDACIÓN DE ESTADO
    if (estado !== "activo" && estado !== "suspendido") {
      return res
        .status(400)
        .json({ mensaje: "El estado debe ser 'activo' o 'suspendido'" });
    }

    // VALIDACIÓN DE ROL
    if (rol !== "Administrador" && rol !== "Cliente") {
      return res
        .status(400)
        .json({ mensaje: "El rol debe ser 'Administrador' o 'Cliente'" });
    }

    // VALIDACIÓN DE CORREO DUPLICADO
    const existeCorreo = await Usuario.findOne({ correo });
    if (existeCorreo) {
      return res.status(400).json({ mensaje: "El correo ya está registrado" });
    }

    // ENCRIPTAR CONTRASEÑA
    const salt = await bcrypt.genSalt(10);
    const contraseñaHash = await bcrypt.hash(contraseña, salt);

    // CREAR NUEVO USUARIO
    const nuevoUsuario = new Usuario({
      nombre,
      correo,
      contraseña: contraseñaHash,
      rol,
      estado,
      registrado: new Date(),
    });

    await nuevoUsuario.save();

    // RESPUESTA EXITOSA
    return res.status(201).json({
      mensaje: "Usuario creado correctamente",
      usuario: {
        nombre,
        correo,
        rol,
        estado,
        registrado: nuevoUsuario.registrado,
      },
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

export default nuevoUsuario;
