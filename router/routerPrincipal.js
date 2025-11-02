import express from "express";
import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";
import bodyParser from "body-parser";
import { body, param, validationResult } from "express-validator";

import { io } from "../index.js";
import { Resend } from "resend";

const resend = new Resend("re_CzkebtUV_N3xrTR77zZiWRmSKTgCE2h4D");

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

import registrarUsuario from "./registrarUsuario.js";
import login from "./login.js";
import registrarPedido from "./registrarPedidos.js";
import eliminarPedido from "./eliminarPedidos.js";
import verPedidoDetalles from "./verPedidoDetalles.js";
import listarProductos from "./listarProductos.js";
import crearProducto from "./crearProducto.js";
import editarProducto from "./editarProducto.js";
import eliminarUsuario from "./eliminarUsuario.js";
import usuarioEdicion from "./usuarioEdiccion.js";
import nuevoUsuario from "./usuarioRegister.js";
import obtenerPromociones from "./obtenerPromociones.js";
import registrarPromocion from "./Promocion.js";
import eliminarPromocion from "./eliminarPromocion.js";
import editarPromocion from "./editarPromocion.js";
import actualizarEstadoPedido from "./actualizarEstadoPedido.js";
import obtenerUsuarioPorId from "../controllers/usuarioGetById.js";
import Pedido from "../model/Pedido.js";
import Usuario from "../model/Usuario.js";
import userModel from "../model/userSchame.js";
import Producto from "../model/Producto.js";
import generarResumen from "./dashboard.js";
import ventas from "./ventas.js";
import EliminarCuenta from "./EliminarCuenta.js";
import verificarPromocion from "./verificarPromocion.js";

import crearMensaje from "../router/crearMensaje.js";
import editarMensaje from "../router/EditarMnesaje.js";
import eliminarMensaje from "../router/eliminarMensaje.js";
import reenviarMensaje from "../router/reenviarMensaje.js";
import verificarToken from "../router/auth.js";
import Mensaje from "../model/MensajeSchema.js";

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("🔹 Cloudinary conectado con:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
});

// Multer Storage con Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "productos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

const router = express.Router();
// split

//
// 🔹 AUTENTICACIÓN Y REGISTRO
//
router.post("/register", registrarUsuario);
router.post("/login", login);

//
// 🔹 PEDIDOS
//
router.post("/pedidos/nuevo", registrarPedido);
router.delete("/pedidos/:id", eliminarPedido);
router.put("/pedidos/:id", actualizarEstadoPedido);
router.get("/pedidos/:id", verPedidoDetalles);

router.get("/listarPedidos", async (req, res) => {
  try {
    const pedidos = await Pedido.find();
    res.json({ pedidos });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

//
// 🔹 USUARIOS
//
router.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await Usuario.find().sort({ registrado: -1 });
    res.status(200).json({ usuarios });
  } catch (err) {
    console.error("GET /usuarios:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.get("/registrados", async (req, res) => {
  try {
    const usuarios = await userModel.find().sort({ createdAt: -1 });
    res.status(200).json({ usuarios });
  } catch (err) {
    console.error("GET /registrados:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// 🔹 Endpoint combinado (admin + registrados)
router.get("/todos", async (req, res) => {
  try {
    const adminUsers = await Usuario.find().sort({ registrado: -1 });
    const registeredUsers = await userModel.find().sort({ createdAt: -1 });

    const usuarios = [
      ...adminUsers.map((u) => ({
        _id: u._id,
        nombre: u.nombre,
        correo: u.correo,
        rol: u.rol || "Administrador",
        estado: u.estado || "activo",
        registrado: u.registrado,
      })),
      ...registeredUsers.map((u) => ({
        _id: u._id,
        nombre: u.name || "Sin nombre",
        correo: u.email,
        rol: "Cliente",
        estado: "activo",
        registrado: u.createdAt,
      })),
    ];

    res.status(200).json({ usuarios });
  } catch (err) {
    console.error("GET /todos:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.post("/usuarios", nuevoUsuario);
router.put("/usuarios/:id", usuarioEdicion);
router.delete("/usuarios/:id", eliminarUsuario);

//
// 🔹 PRODUCTOS (Cloudinary + Multer)
//

router.get("/productos", listarProductos);
router.post("/productos", upload.single("imagen"), crearProducto);
router.put("/productos/:id", upload.single("imagen"), editarProducto);

router.delete("/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const productoEliminado = await Producto.findByIdAndDelete(id);
    if (!productoEliminado) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    io.emit("EliminadoProducto", productoEliminado);
    return res
      .status(200)
      .json({ message: "Producto eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

router.get("/productos/catalogo", async (req, res) => {
  try {
    const productos = await Producto.find().sort({ createdAt: -1 });
    res.json({ productos });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

//
// 🔹 PROMOCIONES
//
router.get("/promociones", obtenerPromociones);
router.post("/promociones", registrarPromocion);
router.delete("/promociones/:id", eliminarPromocion);
router.put("/promociones/:id", editarPromocion);

//
// 🔹 USUARIO POR ID
//
router.get("/usuarios/:id", obtenerUsuarioPorId);

router.get("/dashboard/resumen", async (req, res) => {
  const resumen = await generarResumen();
  res.json(resumen);
});

router.get("/dashboard/resumenVentas/:anio", ventas);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  const { cart } = req.body;

  try {
    const line_items = cart.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.nombre },
        unit_amount: Math.round(Number(item.precio) * 100), // en centavos
      },
      quantity: Number(item.cantidad),
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url:
        "http://localhost:3000/SuccessPage?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/CancelPage",
    });

    // Devuelve la URL directamente
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando sesión de Stripe" });
  }
});

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const payload = req.body;
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        sig,
        process.env.CSClave
      );

      // Cuando se confirma el pago
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // Enviar correo con Resend
        await resend.emails.send({
          from: "Tienda <no-reply@resend.dev>",
          to: session.customer_email,
          subject: "Gracias por tu compra 🎉",
          html: `
          <h2>¡Hola!</h2>
          <p>Tu pago se completó correctamente ✅</p>
          <p>Gracias por tu confianza. Te contactaremos pronto.</p>
        `,
        });

        console.log("✅ Correo enviado a:", session.customer_email);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ Error en webhook:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

router.get("/session/:id", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    // Verificaciones importantes:
    if (session.payment_status !== "paid") {
      return res.status(400).json({ ok: false, message: "Pago no completado" });
    }
    // optional: verificar monto, email, etc.
    return res.json({ ok: true, session });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete("/delete", EliminarCuenta);

router.post("/verificar", verificarPromocion);

const validar = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errores: errors.array() });
  }
  next();
};

router.post(
  "/crear",
  verificarToken,
  [
    body("chatId").notEmpty().withMessage("chatId requerido"),
    body("remitenteId").notEmpty().withMessage("remitenteId requerido"),
    body("destinatarioId").notEmpty().withMessage("destinatarioId requerido"),
    body("texto")
      .isLength({ min: 1 })
      .withMessage("El mensaje no puede estar vacío"),
  ],
  validar,
  async (req, res) => {
    try {
      const nuevo = await crearMensaje(req.body);
      res.status(201).json(nuevo);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✏️ Editar mensaje
router.post(
  "/editar/:id",
  verificarToken,
  [
    param("id").isMongoId().withMessage("ID inválido"),
    body("texto")
      .isLength({ min: 1 })
      .withMessage("El texto no puede estar vacío"),
    body("editorId").notEmpty().withMessage("editorId requerido"),
  ],
  validar,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { texto, editorId } = req.body;
      const actualizado = await editarMensaje(id, texto, editorId);
      res.json(actualizado);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// 🗑️ Eliminar mensaje

router.delete(
  "/eliminar/:id",
  verificarToken,
  [
    param("id").isMongoId().withMessage("ID inválido"),
    body("editorId").notEmpty().withMessage("editorId requerido"),
  ],
  validar,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { editorId } = req.body;
      const eliminado = await eliminarMensaje(id, editorId);
      res.json(eliminado);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// 🔁 Reenviar mensaje
router.post(
  "/reenviar/:id",
  verificarToken,

  [
    param("id").isMongoId().withMessage("ID inválido"),
    body("remitenteId").notEmpty().withMessage("remitenteId requerido"),
    body("destinatarioId").notEmpty().withMessage("destinatarioId requerido"),
  ],
  validar,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { remitenteId, destinatarioId } = req.body;
      const nuevo = await reenviarMensaje(id, remitenteId, destinatarioId);
      res.status(201).json(nuevo);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get("/mensajes/:chatId", async (req, res) => {
  try {
    const msgs = await Mensaje.find({ chatId: req.params.chatId }).sort({
      hora: 1,
    });
    res.json({ mensajes: msgs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
// trim
// toUpperCase
// length
// includes
// startsWith
// substring
// includes
