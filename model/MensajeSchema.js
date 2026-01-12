import mongoose from "mongoose";

const MensajeSchema = new mongoose.Schema(
  {
    texto: { type: String, required: true },
    remitente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    destinatario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    estado: {
      type: String,
      enum: ["pendiente", "entregado", "leido"],
      default: "pendiente",
    },
  },
  { timestamps: true }
);

const Mensaje = mongoose.model("Mensaje", MensajeSchema);
export default Mensaje;
