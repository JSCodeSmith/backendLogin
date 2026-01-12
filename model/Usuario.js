// models/Usuario.js
import mongoose from "mongoose";
// import bcrypt from "bcryptjs"; // 🔥 USA bcryptjs aquí también
// import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET || process.env.CLave;

const UsuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, minlength: 3, maxlength: 50 },
    correo: { type: String, required: true, unique: true, maxlength: 50 },
    contraseña: { type: String, required: true, minlength: 8 },
    avatar: { type: String, default: "" },
    rol: {
      type: String,
      enum: ["Cliente", "Administrador"],
      default: "Cliente",
    },
    estado: { type: String, enum: ["activo", "suspendido"], default: "activo" },
  },
  { timestamps: true }
);

// // Middleware para encriptar contraseña antes de guardar
// UsuarioSchema.pre("save", async function (next) {
//   if (!this.isModified("contraseña")) return next();

//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.contraseña = await bcrypt.hash(this.contraseña, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Método para comparar contraseñas
// UsuarioSchema.methods.compararContraseña = async function (contraseña) {
//   return await bcrypt.compare(contraseña, this.contraseña);
// };

// // Método para generar token JWT
// UsuarioSchema.methods.generarToken = function () {
//   return jwt.sign(
//     {
//       id: this._id,
//       correo: this.correo,
//       rol: this.rol,
//       nombre: this.nombre,
//     },
//     JWT_SECRET,
//     { expiresIn: "7d" }
//   );
// };

// // Método para obtener datos públicos del usuario
// UsuarioSchema.methods.toJSON = function () {
//   const obj = this.toObject();
//   delete obj.contraseña;
//   delete obj.__v;
//   return obj;
// };

// // Método estático para buscar por correo
// UsuarioSchema.statics.buscarPorCorreo = function (correo) {
//   return this.findOne({ correo: correo.toLowerCase() });
// };

const Usuario = mongoose.model("Usuario", UsuarioSchema);
export default Usuario;
// endsWith
// Date().getDay
