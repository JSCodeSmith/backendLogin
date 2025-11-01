import mongoose from "mongoose";

const MensajeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  texto: { type: String, required: true },
  remitenteId: { type: String, required: true },
  destinatarioId: { type: String, required: true },
  chatId: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
});

const Mensaje = mongoose.model("Mensaje", MensajeSchema);
export default Mensaje;
