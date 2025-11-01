// controllers/mensajeController.js
import Mensaje from "../model/MensajeSchema.js";

// Crear nuevo mensaje
export const crearMensaje = async (req, res) => {
  try {
    const nuevoMensaje = new Mensaje(req.body);
    const mensajeGuardado = await nuevoMensaje.save();
    res.status(201).json(mensajeGuardado);
  } catch (error) {
    console.error("Error al crear mensaje:", error);
    res.status(500).json({ error: "Error al crear mensaje" });
  }
};

// Obtener historial
export const obtenerMensajes = async (req, res) => {
  try {
    const mensajes = await Mensaje.find().sort({ createdAt: 1 });
    res.json(mensajes);
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
};

// Eliminar mensaje
export const eliminarMensaje = async (req, res) => {
  try {
    const { id } = req.params;
    await Mensaje.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (error) {
    console.error("Error al eliminar mensaje:", error);
    res.status(500).json({ error: "Error al eliminar mensaje" });
  }
};

// Editar mensaje
export const editarMensaje = async (req, res) => {
  try {
    const { id } = req.params;
    const mensajeActualizado = await Mensaje.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(mensajeActualizado);
  } catch (error) {
    console.error("Error al editar mensaje:", error);
    res.status(500).json({ error: "Error al editar mensaje" });
  }
};
