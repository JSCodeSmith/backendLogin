import { crearMensaje, obtenerMensajes } from "../services/mensajeService.js";

async function addMessage(req, res, next) {
  try {
    const { from, to, message } = req.body;
    const nuevo = await crearMensaje({
      texto: message,
      remitenteId: from,
      destinatarioId: to,
    });
    res.status(201).json({ msg: "Mensaje guardado con éxito", data: nuevo });
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const { from, to } = req.params;
    const mensajes = await obtenerMensajes(from, to);
    res.json({ count: mensajes.length, data: mensajes });
  } catch (err) {
    next(err);
  }
}
export { addMessage, getMessages };
