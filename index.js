import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

import http from "http";

import routerPrincipal from "./router/routerPrincipal.js";
import db from "./db/conexion.js";
import Mensaje from "./model/MensajeSchema.js";
import crearMensaje from "./router/crearMensaje.js";

dotenv.config();
db();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// 🔥 Exportamos io para poder usarlo en los controladores
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

export { io };

app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente ✅");
});

const usuariosConectados = new Map(); // { userId: socket.id }

// --- Socket.io ---
io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  // Registrar usuario al conectarse
  socket.on("registrarUsuario", ({ userId }) => {
    if (!userId) return;
    usuariosConectados.set(userId, socket.id);
    console.log(`✅ Usuario ${userId} registrado con socket ${socket.id}`);
  });

  // Usuario envía mensaje a admin
  socket.on("mensajeAdminPrivado", async ({ paraId, mensaje }) => {
    if (!mensaje || !mensaje.usuario || !mensaje.texto || !paraId) return;

    try {
      const chatId = [mensaje.usuario, paraId].sort().join("_");
      const msgGuardado = await Mensaje.create({
        texto: mensaje.texto,
        remitenteId: mensaje.usuario,
        destinatarioId: paraId,
        chatId,
        timestamp: mensaje.timestamp || new Date(),
        id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      });

      // Emitir al destinatario si está conectado
      const socketDestino = usuariosConectados.get(paraId);
      if (socketDestino) io.to(socketDestino).emit("nuevoMensaje", msgGuardado);

      // Emitir al remitente para actualizar su chat
      io.to(socket.id).emit("nuevoMensaje", msgGuardado);
    } catch (err) {
      console.error("Error al guardar mensaje:", err);
    }
  });

  // --- Mensajes de Admin (igual que usuario) ---
  socket.on("mensajeAdminPrivado", async ({ paraId, mensaje }) => {
    if (!mensaje || !mensaje.usuario || !mensaje.texto || !paraId) return;

    try {
      const chatId = [mensaje.usuario, paraId].sort().join("_");
      const msgGuardado = await Mensaje.create({
        texto: mensaje.texto,
        remitenteId: mensaje.usuario,
        destinatarioId: paraId,
        chatId,
        timestamp: mensaje.timestamp || new Date(),
        id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      });

      const socketDestino = usuariosConectados.get(paraId);
      if (socketDestino) io.to(socketDestino).emit("nuevoMensaje", msgGuardado);
      io.to(socket.id).emit("nuevoMensaje", msgGuardado);
    } catch (err) {
      console.error(err);
    }
  });

  // Editar mensaje
  socket.on("editarMensaje", async ({ id, nuevoTexto }) => {
    if (!id || !nuevoTexto) return;
    try {
      const msg = await Mensaje.findOne({ id });
      if (!msg) return;
      msg.texto = nuevoTexto;
      msg.estado = "editado";
      await msg.save();

      [msg.remitenteId, msg.destinatarioId].forEach((uid) => {
        const sId = usuariosConectados.get(uid);
        if (sId) io.to(sId).emit("mensajeEditado", msg);
      });
    } catch (err) {
      console.error(err);
    }
  });

  // Eliminar mensaje
  // --- Eliminar mensaje ---
  socket.on("eliminarMensaje", async ({ id }) => {
    if (!id) return;
    try {
      const msg = await Mensaje.findOneAndDelete({ id });
      if (!msg) return;

      [msg.remitenteId, msg.destinatarioId].forEach((uid) => {
        const sId = usuariosConectados.get(uid);
        if (sId)
          io.to(sId).emit("mensajeEliminado", {
            id: msg.id,
            chatId: msg.chatId,
          });
      });
    } catch (err) {
      console.error(err);
    }
  });

  // Reenviar mensaje
  // socket.on(
  //   "reenviarMensaje",
  //   async ({ idOriginal, remitenteId, destinatarioId }) => {
  //     try {
  //       const msgOriginal = await Mensaje.findOne({ id: idOriginal });
  //       if (!msgOriginal) return;

  //       const nuevo = new Mensaje({
  //         ...msgOriginal.toObject(),
  //         id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  //         remitenteId,
  //         destinatarioId,
  //         hora: new Date(),
  //       });
  //       await nuevo.save();

  //       const sId = usuariosConectados[destinatarioId];
  //       if (sId) io.to(sId).emit("mensajeReenviado", { mensaje: nuevo });
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   }
  // );

  // Desconexión
  socket.on("disconnect", () => {
    usuariosConectados.forEach((sId, uid) => {
      if (sId === socket.id) usuariosConectados.delete(uid);
    });
    console.log("Cliente desconectado:", socket.id);
  });
});

app.get("/", (req, res) => res.send("Servidor funcionando ✅"));

app.use("/api/users", routerPrincipal);

const PORT = 3005;
server.listen(PORT, () => {
  console.log(
    `🚀 Servidor con Socket.IO y Express corriendo en el puerto ${PORT}`
  );
});
