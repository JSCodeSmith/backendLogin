import userModel from "../model/userSchame.js";
import Usuario from "../model/Usuario.js";

const obtenerUsuarioPorId = async (req, res) => {
  try {
    let { id } = req.params; // usar let para poder reasignar
    id = id.trim();

    let usuario = await Usuario.findById(id);
    if (!usuario) {
      usuario = await userModel.findById(id);
    }

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.status(200).json({ usuario });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export default obtenerUsuarioPorId;
