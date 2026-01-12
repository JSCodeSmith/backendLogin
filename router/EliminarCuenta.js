// import jwt from "jsonwebtoken";
// import User from "../model/userSchame.js";

// const EliminarCuenta = async (req, res) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//       return res.status(401).json({ msg: "Token no proporcionado" });
//     }

//     const token = authHeader.split(" ")[1];

//     const decoded = jwt.verify(token, process.env.CLave);

//     console.log(decoded);

//     const user = await User.findByIdAndDelete(decoded.id);
//     console.log(user);
//     if (!user) {
//       return res.status(404).json({ msg: "Usuario no encontrado" });
//     }

//     res.json({ msg: "Cuenta eliminada correctamente" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Error al eliminar cuenta" });
//   }
// };

// export default EliminarCuenta;
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../model/userSchame.js";
import Mensaje from "../model/MensajeSchema.js";
import Chat from "../model/Chat.js";

const EliminarCuenta = async (req, res) => {
  try {
    console.log("🔴 Solicitud de eliminación de cuenta recibida");

    // 1️⃣ VERIFICAR TOKEN
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        msg: "Acceso no autorizado. Token requerido.",
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.CLave);
      console.log(`👤 Usuario verificando eliminación: ${decoded.email}`);
    } catch (tokenError) {
      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          msg: "Tu sesión ha expirado. Inicia sesión nuevamente.",
        });
      }
      return res.status(401).json({
        success: false,
        msg: "Token inválido o corrupto.",
      });
    }

    // 2️⃣ OBTENER USUARIO
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "Usuario no encontrado en la base de datos.",
      });
    }

    console.log(`🔍 Usuario encontrado: ${user.email}`);

    // 3️⃣ VERIFICAR CONTRASEÑA
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        msg: "Se requiere contraseña para confirmar la eliminación.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`❌ Contraseña incorrecta para: ${user.email}`);
      return res.status(401).json({
        success: false,
        msg: "Contraseña incorrecta. No se puede proceder con la eliminación.",
      });
    }

    console.log(`✅ Contraseña verificada para: ${user.email}`);

    // 4️⃣ ELIMINAR DATOS RELACIONADOS (OPCIONAL PERO RECOMENDADO)
    try {
      // Eliminar mensajes del usuario
      const mensajesEliminados = await Mensaje.deleteMany({
        $or: [{ remitente: user._id }, { destinatario: user._id }],
      });
      console.log(`🗑️ Mensajes eliminados: ${mensajesEliminados.deletedCount}`);

      // Eliminar chats donde participa el usuario
      const chatsEliminados = await Chat.deleteMany({
        participantes: user._id,
      });
      console.log(`🗑️ Chats eliminados: ${chatsEliminados.deletedCount}`);
    } catch (dbError) {
      console.error(
        "⚠️ Error al eliminar datos relacionados:",
        dbError.message
      );
      // Continuamos aunque falle, lo importante es eliminar el usuario
    }

    // 5️⃣ ELIMINAR USUARIO
    await User.findByIdAndDelete(user._id);

    console.log(`✅✅✅ USUARIO ELIMINADO PERMANENTEMENTE: ${user.email}`);
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    console.log(`🆔 ID: ${user._id}`);

    // 6️⃣ RESPONDER ÉXITO
    res.json({
      success: true,
      msg: "Cuenta eliminada permanentemente.",
      timestamp: new Date().toISOString(),
      email: user.email,
      deletedAt: new Date(),
    });
  } catch (error) {
    console.error("💥 ERROR CRÍTICO al eliminar cuenta:", error);

    // Log detallado para debugging
    console.error("Detalles del error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      msg: "Error interno del servidor al procesar la eliminación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export default EliminarCuenta;
