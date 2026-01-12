import Mensaje from "../model/MensajeSchema.js";
import Chat from "../model/Chat.js";

// Crear mensaje

async function crearMensaje({ texto, remitenteId, destinatarioId }) {
  // Buscar chat existente entre los dos usuarios
  let chat = await Chat.findOne({
    participantes: { $all: [remitenteId, destinatarioId] },
  });

  // Si no existe chat, crearlo
  if (!chat) {
    chat = await Chat.create({ participantes: [remitenteId, destinatarioId] });
  }

  // Crear mensaje nuevo
  const nuevo = await Mensaje.create({
    texto,
    remitente: remitenteId,
    destinatario: destinatarioId,
    chat: chat._id,
    estado: "pendiente", // pendiente, entregado o leído
  });

  // Actualizar último mensaje del chat
  chat.ultimoMensaje = nuevo._id;
  await chat.save();

  return nuevo;
}

// Obtener mensajes entre dos usuarios
async function obtenerMensajes(remitenteId, destinatarioId) {
  const chat = await Chat.findOne({
    participantes: { $all: [remitenteId, destinatarioId] },
  });
  if (!chat) return [];

  const mensajes = await Mensaje.find({ chat: chat._id })
    .sort({ createdAt: 1 })
    .populate("remitente", "nombre correo ")
    .populate("destinatario", "nombre correo ");

  return mensajes;
}
export { crearMensaje, obtenerMensajes };
