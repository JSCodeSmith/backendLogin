import Chat from "../model/Chat.js";

export async function obtenerOCrearChat(idUser, idAdmin) {
  let chat = await Chat.findOne({
    participantes: { $all: [idUser, idAdmin] },
  });

  if (!chat) {
    chat = await Chat.create({
      participantes: [idUser, idAdmin],
    });
  }

  return chat;
}

export default obtenerOCrearChat;

// const participantesOrdenados = [userA, userB].sort();

// try {
//   // Intentar crear nuevo chat
//   const chat = await Chat.create({ participantes: participantesOrdenados });

//   // Popular campos correctamente (Mongoose 6+)
//   await chat.populate([
//     { path: "participantes", select: "nombre avatar rol estado" },
//     {
//       path: "ultimoMensaje",
//       select: "texto remitente destinatario createdAt estado",
//     },
//   ]);

//   return chat;
// } catch (err) {
//   if (err.code === 11000) {
//     // Chat ya existe
//     const chatExistente = await Chat.findOne({
//       participantes: participantesOrdenados,
//     })
//       .populate("participantes", "nombre avatar rol estado")
//       .populate(
//         "ultimoMensaje",
//         "texto remitente destinatario createdAt estado"
//       );

//     return chatExistente;
//   } else {
//     throw err;
//   }
// }
