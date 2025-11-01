import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  rol: { type: String, enum: ["Cliente", "Administrador"], required: true },
  estado: { type: String, enum: ["activo", "suspendido"], default: "activo" },

  registrado: { type: Date, default: Date.now },
});

const Usuario = mongoose.model("Usuario", usuarioSchema);
export default Usuario;
