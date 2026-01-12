import messageModel from "../model/messageSchema.js";

/**
 * 💬 Enviar mensaje
 * Guarda un mensaje entre dos usuarios en la base de datos
 */
const sendMessage = async (req, res) => {
  try {
    const { from, to, message } = req.body;

    if (!from || !to || !message) {
      return res
        .status(400)
        .json({ error: "Faltan campos obligatorios (from, to, message)" });
    }

    const data = await messageModel.create({
      message: { text: message },
      users: [from, to],
      sender: from,
    });

    return res.status(201).json({ mensaje: "Mensaje enviado", data });
  } catch (error) {
    console.error("Error en sendMessage:", error);
    return res.status(500).json({ error: "Error al enviar mensaje" });
  }
};

/**
 * 📜 Obtener todos los mensajes entre dos usuarios
 */
const getAllMessages = async (req, res) => {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res
        .status(400)
        .json({ error: "Faltan campos obligatorios (from, to)" });
    }

    const messages = await messageModel
      .find({
        users: {
          $all: [from, to],
        },
      })
      .sort({ updatedAt: 1 }); // 🔽 Orden cronológico

    const projectedMessages = messages.map((msg) => ({
      fromSelf: msg.sender.toString() === from,
      message: msg.message.text,
      createdAt: msg.createdAt,
    }));

    return res.status(200).json(projectedMessages);
  } catch (error) {
    console.error("Error en getAllMessages:", error);
    return res.status(500).json({ error: "Error al obtener mensajes" });
  }
};

export { sendMessage, getAllMessages };
