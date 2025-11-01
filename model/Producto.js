import mongoose from "mongoose";

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      trim: true,
      unique: true,
    },
    categoria: {
      type: String,
      required: [true, "La categoría es obligatoria"],
      trim: true,
    },
    descripcion: {
      type: String,
      default: "Sin descripción",
      trim: true,
    },
    precio: {
      type: Number,
      required: [true, "El precio es obligatorio"],
      min: [0, "El precio no puede ser negativo"],
    },
    stock: {
      type: Number,
      required: [true, "El stock es obligatorio"],
      min: [0, "El stock no puede ser negativo"],
    },
    imagen: {
      type: String,
      default: null, // Guardará la URL de Cloudinary
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    estado: {
      type: String,
      enum: ["activo", "inactivo"],
      default: "activo",
    },
  },
  {
    versionKey: false, // evita el campo __v
    timestamps: true, // crea createdAt y updatedAt automáticamente
  }
);

const Producto = mongoose.model("Producto", productoSchema);

export default Producto;
