import userModel from "../model/userSchame.js";
import Usuario from "../model/Usuario.js";

const usuarioEdicion = async (req, res) => {
  try {
    let { id } = req.params;
    id = id.trim();

    const { nombre, correo, rol, estado } = req.body;

    // 🔹 Buscar si existe otro usuario con el mismo correo
    const usuarioExistente = await Usuario.findOne({ correo });
    if (usuarioExistente && usuarioExistente._id.toString() !== id) {
      return res
        .status(400)
        .json({ mensaje: "El correo ya está registrado por otro usuario" });
    }

    // 🔹 Intentar actualizar primero en la colección de administradores
    let usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      { nombre, correo, rol, estado },
      { new: true }
    );

    // 🔹 Si no existe ahí, probar en userModel
    if (!usuarioActualizado) {
      usuarioActualizado = await userModel.findByIdAndUpdate(
        id,
        { name: nombre, email: correo }, // campos reales en userModel
        { new: true }
      );
    }

    // 🔹 Si no se encontró en ninguna
    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // 🔹 Respuesta exitosa
    return res.status(200).json({
      mensaje: "Usuario actualizado correctamente",
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error("❌ Error al editar usuario:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

export default usuarioEdicion;
