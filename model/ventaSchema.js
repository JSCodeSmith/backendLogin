import mongoose from "mongoose";

const ventaSchema = new mongoose.Schema({
  productoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Producto",
    required: true,
  },
  categoria: { type: String, required: true }, // "ropa", "calzado", etc.
  cantidad: { type: Number, required: true },
  monto: { type: Number, required: true }, // total de la venta
  fecha: { type: Date, default: Date.now },
});

const Venta = mongoose.model("Venta", ventaSchema);
export default Venta;
