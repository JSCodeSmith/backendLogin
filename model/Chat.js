import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    participantes: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    ],
    ultimoMensaje: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mensaje",
    },
  },
  { timestamps: true }
);

// 🔹 Hook: siempre ordena los participantes antes de guardar
ChatSchema.pre("save", function (next) {
  if (this.participantes && this.participantes.length > 1) {
    this.participantes.sort(); // mantiene siempre el mismo orden
  }
  next();
});

// 🔹 Índice único: evita chats duplicados entre los mismos usuarios
ChatSchema.index({ participantes: 1 }, { unique: true });

// ✅ Ahora recién se crea el modelo
const Chat = mongoose.model("Chat", ChatSchema);
export default Chat;
