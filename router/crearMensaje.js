// import Mensaje from "../model/MensajeSchema.js";

// async function crearMensaje({ mensaje, paraId }) {
//   if (!mensaje || !mensaje.texto || !mensaje.usuario) {
//     throw new Error("Datos de mensaje incompletos");
//   }

//   const nuevo = await Mensaje.create({
//     texto: mensaje.texto,
//     remitenteId: mensaje.usuario,
//     destinatarioId: paraId,
//     chatId: [mensaje.usuario, paraId].sort().join("_"),
//     id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
//   });
//   return nuevo;
// }

// export default crearMensaje;
