import mongoose from "mongoose";

const PromocionSchema = new mongoose.Schema({
  codigo: { type: String, required: true },
  descripcion: { type: String, required: true },
  descuento: { type: Number, required: true, min: 0, max: 100 }, // debe ser Number
  fechaInicio: { type: Date },
  fechaFin: { type: Date },
  estado: { type: String },
});

const Promociones = mongoose.model("Promociones", PromocionSchema);
export default Promociones;
