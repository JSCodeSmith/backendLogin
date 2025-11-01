import Mensaje from "../model/MensajeSchema.js";
async function reenviarMensaje(idOriginal, remitenteId, destinatarioId) {
  try {
    const original = await Mensaje.findOne({ id: idOriginal });
    if (!original) throw new Error("Mensaje original no encontrado");

    const nuevo = new Mensaje({
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      chatId: destinatarioId,
      remitenteId,
      destinatarioId,
      texto: `📤 Reenviado: ${original.texto}`,
      tipo: "usuario",
      estado: "reenviado",
      esReenvio: true,
      idMensajeOriginal: original.id,
    });

    await nuevo.save();
    return nuevo;
  } catch (err) {
    console.error("Error al reenviar:", err.message);
    throw err;
  }
}
export default reenviarMensaje;
