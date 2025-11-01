import mongoose from "mongoose";

const pedidoSchema = new mongoose.Schema(
  {
    // 👤 Datos del cliente
    cliente: {
      nombre: {
        type: String,
        required: [true, "El nombre del cliente es obligatorio."],
        trim: true,
      },
      correo: {
        type: String,
        required: [true, "El correo del cliente es obligatorio."],
        trim: true,
        lowercase: true,
      },
      telefono: {
        type: String,
        required: [true, "El teléfono del cliente es obligatorio."],
        trim: true,
      },
      direccion: {
        type: String,
        required: [true, "La dirección del cliente es obligatoria."],
        trim: true,
      },
    },

    // 🛍 Lista de productos

    productos: [
      {
        productoId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Producto",
          required: false,
        },
        nombre: { type: String, required: true, trim: true },
        cantidad: { type: Number, required: true, min: 1 },
        precioUnitario: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
      },
    ],

    // 💬 Observaciones opcionales
    observaciones: {
      type: String,
      trim: true,
      default: "",
    },

    // 💰 Total del pedido
    total: {
      type: Number,
      required: true,
      min: [0, "El total no puede ser negativo."],
    },

    // ⚙️ Estado del pedido
    estado: {
      type: String,
      enum: ["pendiente", "en proceso", "entregado", "cancelado"],
      default: "pendiente",
    },
  },
  {
    timestamps: true, // 🕒 agrega createdAt y updatedAt automáticamente
  }
);

// 🔢 Middleware opcional para recalcular total automáticamente
pedidoSchema.pre("save", function (next) {
  if (Array.isArray(this.productos) && this.productos.length > 0) {
    this.total = this.productos.reduce(
      (sum, p) => sum + p.precioUnitario * p.cantidad,
      0
    );
  } else {
    this.total = 0;
  }
  next();
});

const Pedido = mongoose.model("Pedido", pedidoSchema);
export default Pedido;
