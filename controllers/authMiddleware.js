// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import Usuario from "../model/Usuario.js"; // Nota el .js

// Clave secreta para JWT (debe estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || process.env.CLave;

// Middleware para verificar token
export const verificarToken = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Acceso denegado. No hay token proporcionado.",
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar usuario en la base de datos
    const usuario = await Usuario.findById(decoded.id).select("-contraseña");

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado.",
      });
    }

    // Verificar si el usuario está activo
    if (usuario.estado !== "activo") {
      return res.status(401).json({
        success: false,
        message: "Cuenta suspendida. Contacta al administrador.",
      });
    }

    // Agregar usuario al request
    req.usuario = usuario;
    req.userId = decoded.id;

    next();
  } catch (error) {
    console.error("Error en verificarToken:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error al verificar token.",
    });
  }
};

// Middleware para verificar si es administrador
export const esAdmin = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado.",
      });
    }

    // Verificar rol de administrador según tu modelo
    if (req.usuario.rol !== "Administrador") {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado. Se requieren permisos de administrador.",
      });
    }

    next();
  } catch (error) {
    console.error("Error en esAdmin:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error al verificar permisos.",
    });
  }
};

// Middleware para verificar si es cliente o admin
export const esClienteOAdmin = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado.",
      });
    }

    // Verificar si es cliente o admin según tu modelo
    if (req.usuario.rol !== "Cliente" && req.usuario.rol !== "Administrador") {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado. Rol no autorizado.",
      });
    }

    next();
  } catch (error) {
    console.error("Error en esClienteOAdmin:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error al verificar permisos.",
    });
  }
};

// Middleware para verificar propiedad (usuario es dueño del recurso o es admin)
export const esPropietarioOAdmin = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado.",
      });
    }

    const resourceId = req.params.id || req.body.userId;

    // Si es admin, permitir acceso
    if (req.usuario.rol === "Administrador") {
      return next();
    }

    // Si es el dueño del recurso, permitir acceso
    if (req.usuario._id.toString() === resourceId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Acceso denegado. No eres el propietario de este recurso.",
    });
  } catch (error) {
    console.error("Error en esPropietarioOAdmin:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error al verificar permisos.",
    });
  }
};

// Middleware para verificar solo clientes
export const esCliente = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado.",
      });
    }

    // Verificar si es cliente
    if (req.usuario.rol !== "Cliente") {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado. Solo para clientes.",
      });
    }

    next();
  } catch (error) {
    console.error("Error en esCliente:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error al verificar permisos.",
    });
  }
};
