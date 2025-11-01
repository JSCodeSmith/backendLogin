import Mensaje from "../model/MensajeSchema.js";

const editarMensaje = async (req, res) => {
  try {
    const { id, nuevoTexto, editorId } = req.body;

    const mensaje = await Mensaje.findOne({ id });
    if (!mensaje)
      return res.status(404).json({ error: "Mensaje no encontrado" });
    if (mensaje.eliminado)
      return res
        .status(400)
        .json({ error: "No se puede editar un mensaje eliminado" });

    mensaje.textoAnterior.push(mensaje.texto);
    mensaje.texto = nuevoTexto;
    mensaje.version += 1;
    mensaje.estado = "editado";
    mensaje.editadoPor = editorId;

    await mensaje.save();
    res.json({ mensaje });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export default editarMensaje;
