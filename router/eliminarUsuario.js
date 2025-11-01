import userModel from "../model/userSchame.js";
import Usuario from "../model/Usuario.js";

const eliminarUsuario = async (req, res) => {
  try {
    let { id } = req.params;
    id = id.trim();

    // 🔹 Intentar eliminar primero en la colección de administradores
    let usuarioEliminado = await Usuario.findByIdAndDelete(id);

    // 🔹 Si no existe ahí, eliminar en la colección de usuarios registrados
    if (!usuarioEliminado) {
      usuarioEliminado = await userModel.findByIdAndDelete(id);
    }

    // 🔹 Si no se encontró en ninguna colección
    if (!usuarioEliminado) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // 🔹 Si se eliminó correctamente
    return res.status(200).json({
      mensaje: "Usuario eliminado correctamente",
      usuario: usuarioEliminado,
    });
  } catch (error) {
    console.error("❌ Error al eliminar el usuario:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

export default eliminarUsuario;
