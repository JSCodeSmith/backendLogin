// models/Categoria.js
import mongoose from "mongoose";

const categoriaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  descripcion: {
    type: String,
    required: false,
    default: "",
  },
  imagen: {
    type: String,
    default: "",
  },
  icono: {
    type: String,
    default: "📦",
  },
  color: {
    type: String,
    default: "#4F46E5", // Color por defecto (índigo)
  },
  esActiva: {
    type: Boolean,
    default: true,
  },
  orden: {
    type: Number,
    default: 0,
  },
  cantidadProductos: {
    type: Number,
    default: 0,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now,
  },
});

const Categoria = mongoose.model("Categoria", categoriaSchema);
export default Categoria;
