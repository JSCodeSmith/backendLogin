import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";

import mensajeRoutes from "./router/mensajeRoutes.js";
import messageRoutes from "./router/messageRoutes.js";
import useRouter from "./router/userRoutes.js";

import http from "http";

import routerPrincipal from "./router/routerPrincipal.js";
import db from "./db/conexion.js";
import verificarToken from "./router/auth.js";
import verificarTokenSock from "./util/verificarTokenSock.js";
import path from "path";
import Mensaje from "./model/MensajeSchema.js";
import { crearMensaje } from "./services/mensajeService.js";
import { log } from "console";
import Chat from "../backend/model/Chat.js";
import obtenerOCrearChat from "./controllers/ChatController.js";
import Usuario from "./model/Usuario.js";
import Producto from "./model/Producto.js";
import reseñasProductoRouter from "./router/reseñasProductoRouter.js";
import { setIo } from "./util/socketInstance.js";
import Comment from "./model/commentSchema.js";
import Review from "./model/reviewSchema.js";
import { generateAvatar } from "./services/generaciones.js";
import mongoose from "mongoose";
import categoriaRoutes from "./router/categoriaRoutes.js";
import Categoria from "./model/Categoria.js";

import userModel from "./model/userSchame.js";

// import Mensaje from "./model/MensajeSchema.js";
// import crearMensaje from "./router/crearMensaje.js";

db();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

setIo(io);
// 🔥 Exportamos io para poder usarlo en los controladores
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/mensajes", mensajeRoutes);
app.use("/api/usuarios", useRouter);
app.set("io", io);
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente ✅");
});
export { io };
// const usuariosConectados = new Map(); // { userId: socket.id }

const isValidObjectId = (id) => {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    typeof id === "string" &&
    id.length === 24
  );
};

global.onlineUsers = new Map();

// ⚠️ Este middleware se ejecuta antes de aceptar la conexión
io.use((socket, next) => {
  const token = socket.handshake.auth?.token; // cliente lo envía así: io("url", { auth: { token } })

  if (!token) {
    // Permitir conexión para eventos públicos (productos)
    socket.userId = null;
    socket.isPublic = true;
    console.log("🌐 Conexión pública para productos:", socket.id);
    return next();
  }

  try {
    const payload = verificarTokenSock(token);
    socket.userId = payload.id;
    socket.isPublic = false;
    next();
  } catch (err) {
    console.error("❌ Error de auth en socket:", err.message);
    next(new Error("Auth error"));
  }
});

io.on("connection", (socket) => {
  socket.on("get-online-users", () => {
    console.log(
      "👥 Usuarios online:",
      Array.from(global.onlineUsers.entries())
    );
    socket.emit("online-users-list", Array.from(global.onlineUsers.entries()));
  });
  const userId = socket.userId;

  socket.on("join-product-room", (productId) => {
    console.log(`📦 Cliente ${socket.id} se une a product-${productId}`);
    socket.join(`product-${productId}`);
  });
  socket.on("leave-product-room", (productId) => {
    console.log(`🚪 Cliente ${socket.id} sale de product-${productId}`);
    socket.leave(`product-${productId}`);
  });

  // Función para emitir eventos a la sala correctamente
  const emitToProductRoom = (productId, event, data) => {
    console.log(`📡 Emitiendo ${event} a product-${productId}:`, data);
    io.to(`product-${productId}`).emit(event, data);
  };

  if (userId) {
    global.onlineUsers.set(userId.toString(), socket.id);
    console.log("✅ Usuario conectado:", userId, "Socket ID:", socket.id);

    // Emitir para debug
    socket.emit("connected", { userId: userId.toString() });
  }

  // --- Mensaje usuario → administrador ---
  socket.on("usuario-msg", async (payload, callback) => {
    try {
      const { from, texto: messageText } = payload;

      if (!from) throw new Error("Falta from");
      if (!messageText) throw new Error("Falta mensaje");

      let adminId = null;
      let adminSocketId = null;

      console.log("👥 Usuarios online antes de buscar admin:");
      console.log(Array.from(global.onlineUsers.entries()));

      // Buscar en onlineUsers quién es admin
      for (const [userId, socketId] of global.onlineUsers.entries()) {
        // Necesitas verificar en la DB si este userId es admin
        const user = await Usuario.findById(userId);
        if (user && user.rol === "Administrador") {
          adminId = userId;
          adminSocketId = socketId;
          console.log("🎯 Admin conectado encontrado:", adminId);
          break;
        }
      }
      if (!adminId) {
        const adminUser = await Usuario.findOne({ rol: "Administrador" });
        if (adminUser) {
          adminId = adminUser._id.toString();
        }
      }

      if (!adminId) throw new Error("No hay administrador disponible");

      const fromId = from.toString(); // Asegurar string

      console.log("📨 Mensaje de usuario a admin:", {
        from: fromId,
        to: adminId,
        texto: messageText,
      });

      let chat = await Chat.findOne({
        participantes: { $all: [fromId, adminId] },
      });

      if (!chat) {
        chat = await Chat.create({
          participantes: [fromId, adminId],
        });
      }

      const nuevo = await Mensaje.create({
        texto: messageText,
        remitente: fromId,
        destinatario: adminId,
        chat: chat._id,
        estado: "pendiente",
      });

      chat.ultimoMensaje = nuevo._id;
      await chat.save();

      const chatPopulado = await Chat.findById(chat._id)
        .populate("participantes", "nombre rol estado")
        .populate({
          path: "ultimoMensaje",
          select: "texto remitente destinatario createdAt estado",
        });

      // Obtener socket IDs
      const userSocketId = global.onlineUsers.get(fromId);

      console.log("🔌 Socket IDs encontrados:", {
        adminId,
        adminSocketId,
        fromId,
        userSocketId,
        onlineUsers: Array.from(global.onlineUsers.entries()),
      });

      // Enviar mensaje directamente
      const mensajeParaEmitir = {
        _id: nuevo._id,
        texto: nuevo.texto,
        remitente: nuevo.remitente,
        destinatario: nuevo.destinatario,
        createdAt: nuevo.createdAt,
        estado: nuevo.estado,
        chat: chat._id,
      };

      // Enviar al usuario (remitente)
      if (userSocketId) {
        io.to(userSocketId).emit("msg-receive", mensajeParaEmitir);
        console.log("📤 Mensaje enviado al usuario (socket):", userSocketId);
      }

      // Enviar al admin
      if (adminSocketId) {
        io.to(adminSocketId).emit("msg-receive", mensajeParaEmitir);
        console.log("📤 Mensaje enviado al admin (socket):", adminSocketId);
      } else {
        console.log("⚠️ Admin no conectado:", adminId);
      }

      // Actualizar estado a entregado
      await Mensaje.findByIdAndUpdate(nuevo._id, { estado: "entregado" });

      const mensajeEntregado = { ...mensajeParaEmitir, estado: "entregado" };

      // Notificar entregado
      if (userSocketId) {
        io.to(userSocketId).emit("msg-delivered", {
          id: nuevo._id,
          mensaje: mensajeEntregado,
        });
      }

      if (adminSocketId) {
        io.to(adminSocketId).emit("msg-delivered", {
          id: nuevo._id,
          mensaje: mensajeEntregado,
        });
      }
    } catch (err) {
      console.error("❌ Error usuario-msg:", err);
      if (callback) callback({ error: err.message });
    }
  });

  // --- Mensaje admin → usuario ---
  socket.on("admin-msg", async ({ userIdDest, texto }) => {
    try {
      if (!socket.userId)
        throw new Error("Falta socket.userId (admin no autenticado)");
      if (!userIdDest) throw new Error("Falta el destinatario");
      if (!texto) throw new Error("Falta el mensaje");

      let chat = await Chat.findOne({
        participantes: { $all: [socket.userId, userIdDest] },
      });

      if (!chat) {
        chat = await Chat.create({
          participantes: [socket.userId, userIdDest],
        });
      }

      const nuevo = await Mensaje.create({
        texto,
        remitente: socket.userId,
        destinatario: userIdDest,
        chat: chat._id,
        estado: "pendiente",
      });

      chat.ultimoMensaje = nuevo._id;
      await chat.save();

      const chatPop = await Chat.findById(chat._id)
        .populate("participantes", "nombre rol estado")
        .populate({ path: "ultimoMensaje" });

      const userSocketId = global.onlineUsers.get(userIdDest);

      // Enviar chat actualizado
      if (userSocketId) io.to(userSocketId).emit("chat-actualizado", chatPop);
      socket.emit("chat-actualizado", chatPop);

      // Enviar mensaje
      if (userSocketId) io.to(userSocketId).emit("msg-receive", nuevo);
      socket.emit("msg-receive", nuevo);

      await Mensaje.findByIdAndUpdate(nuevo._id, { estado: "entregado" });

      if (userSocketId)
        io.to(userSocketId).emit("msg-delivered", { id: nuevo._id });
      socket.emit("msg-delivered", { id: nuevo._id });
    } catch (err) {
      console.error("Error admin-msg:", err);
    }
  });

  // 2) enviar mensaje en tiempo real
  // payload: { from, to, messageText }

  socket.on("send-msg", async (payload, callback) => {
    try {
      const { from, to, messageText } = payload;

      // Crear chat si no existe
      // let chat = await Chat.findOne({ participantes: { $all: [from, to] } });
      // if (!chat) chat = await Chat.create({ participantes: [from, to] });
      const chat = await obtenerOCrearChat(from, to);

      // Crear mensaje en DB
      const nuevo = await Mensaje.create({
        texto: messageText,
        remitente: from,
        destinatario: to,
        chat: chat._id,
        estado: "pendiente",
      });
      // Actualizar último mensaje del chat
      chat.ultimoMensaje = nuevo._id;
      await chat.save();

      const chatPopulado = await Chat.findById(chat._id)
        .populate("participantes", "nombre  rol estado")
        .populate({
          path: "ultimoMensaje",
          select: "texto remitente destinatario createdAt estado",
        });
      socket.emit("chat-actualizado", chatPopulado);

      const toSocketId = global.onlineUsers.get(to);

      io.to(socket.id).emit("msg-receive", nuevo);

      if (toSocketId) {
        io.to(toSocketId).emit("msg-receive", nuevo);
      }

      // Marcar como entregado en DB
      await Mensaje.findByIdAndUpdate(nuevo._id, { estado: "entregado" });
      // Notificar al emisor que fue entregado
      socket.emit("msg-delivered", { id: nuevo._id });
      if (toSocketId)
        io.to(toSocketId).emit("msg-delivered", { id: nuevo._id });
    } catch (err) {
      console.error("Error send-msg:", err);
    }
  });

  // 3) marcar mensaje como leído (payload: { messageId, from, to })
  socket.on("msg-read", async ({ messageId, from, to }) => {
    try {
      await Mensaje.findByIdAndUpdate(messageId, { estado: "leido" });
      const senderSocketId = global.onlineUsers.get(to);
      if (senderSocketId) {
        io.to(senderSocketId).emit("msg-read-back", { messageId, by: from });
      }
      socket.emit("msg-read-back", { messageId, by: from }); // para el lector también
    } catch (err) {
      console.error("Error msg-read:", err);
    }
  });

  socket.on("crear-producto", async (productoData) => {
    try {
      const nuevoProducto = await Producto.create(productoData);
      const productoPopulado = await Producto.findById(nuevoProducto._id)
        .populate("vendedor", "nombre email")
        .populate("categoria", "nombre");

      // Emitir a TODOS los clientes conectados
      io.emit("nuevoProducto", productoPopulado);
      console.log("🆕 Producto creado y emitido:", productoPopulado._id);
    } catch (error) {
      console.error("❌ Error al crear producto:", error);
      socket.emit("error-crear-producto", { error: error.message });
    }
  });

  // 3. Cuando se actualiza un producto
  socket.on("actualizar-producto", async ({ id, datos }) => {
    try {
      const productoActualizado = await Producto.findByIdAndUpdate(id, datos, {
        new: true,
        runValidators: true,
      })
        .populate("vendedor", "nombre email")
        .populate("categoria", "nombre");

      if (!productoActualizado) {
        return socket.emit("error-actualizar-producto", {
          error: "Producto no encontrado",
        });
      }

      // Emitir a TODOS los clientes conectados
      io.emit("ActualizadoProducto", productoActualizado);
      console.log("♻ Producto actualizado y emitido:", productoActualizado._id);
    } catch (error) {
      console.error("❌ Error al actualizar producto:", error);
      socket.emit("error-actualizar-producto", { error: error.message });
    }
  });

  // 4. Cuando se elimina un producto
  socket.on("eliminar-producto", async (productoId) => {
    try {
      const productoEliminado = await Producto.findByIdAndDelete(productoId);

      if (!productoEliminado) {
        return socket.emit("error-eliminar-producto", {
          error: "Producto no encontrado",
        });
      }

      // Emitir a TODOS los clientes conectados
      io.emit("EliminadoProducto", { _id: productoId });
      console.log("🗑 Producto eliminado y emitido:", productoId);
    } catch (error) {
      console.error("❌ Error al eliminar producto:", error);
      socket.emit("error-eliminar-producto", { error: error.message });
    }
  });

  // 5. Cuando un cliente solicita la lista inicial de productos
  socket.on("solicitar-productos", async () => {
    try {
      const productos = await Producto.find()
        .populate("vendedor", "nombre email")
        .populate("categoria", "nombre")
        .sort({ createdAt: -1 });

      socket.emit("lista-productos", productos);
      console.log("📦 Lista de productos enviada a:", socket.id);
    } catch (error) {
      console.error("❌ Error al obtener productos:", error);
      socket.emit("error-lista-productos", { error: error.message });
    }
  });

  // 1. Crear categoría
  socket.on("crear-categoria", async (categoriaData) => {
    try {
      const nuevaCategoria = await Categoria.create(categoriaData);

      io.emit("categoriaCreada", nuevaCategoria);
      console.log("🆕 Categoría creada y emitida:", nuevaCategoria._id);
    } catch (error) {
      console.error("❌ Error al crear categoría:", error);
      socket.emit("error-crear-categoria", { error: error.message });
    }
  });

  // 2. Actualizar categoría
  socket.on("actualizar-categoria", async ({ id, datos }) => {
    try {
      const categoriaActualizada = await Categoria.findByIdAndUpdate(
        id,
        datos,
        { new: true, runValidators: true }
      );

      if (!categoriaActualizada) {
        return socket.emit("error-actualizar-categoria", {
          error: "Categoría no encontrada",
        });
      }

      io.emit("categoriaActualizada", categoriaActualizada);
      console.log(
        "♻ Categoría actualizada y emitida:",
        categoriaActualizada._id
      );
    } catch (error) {
      console.error("❌ Error al actualizar categoría:", error);
      socket.emit("error-actualizar-categoria", { error: error.message });
    }
  });

  // 3. Eliminar categoría
  socket.on("eliminar-categoria", async (categoriaId) => {
    try {
      const categoriaEliminada = await Categoria.findByIdAndDelete(categoriaId);

      if (!categoriaEliminada) {
        return socket.emit("error-eliminar-categoria", {
          error: "Categoría no encontrada",
        });
      }

      io.emit("categoriaEliminada", { _id: categoriaId });
      console.log("🗑 Categoría eliminada y emitida:", categoriaId);
    } catch (error) {
      console.error("❌ Error al eliminar categoría:", error);
      socket.emit("error-eliminar-categoria", { error: error.message });
    }
  });

  // 4. Solicitar lista de categorías
  socket.on("solicitar-categorias", async () => {
    try {
      const categorias = await Categoria.find({ esActiva: true }).sort({
        orden: 1,
        nombre: 1,
      });

      socket.emit("lista-categorias", categorias);
      console.log("📂 Lista de categorías enviada a:", socket.id);
    } catch (error) {
      console.error("❌ Error al obtener categorías:", error);
      socket.emit("error-lista-categorias", { error: error.message });
    }
  });

  socket.on("comment-added", ({ productId, comment }) => {
    console.log("💬 Comentario agregado via socket:", comment.id);
    io.to(`product-${productId}`).emit("comment-added", {
      productId,
      comment,
    });
  });
  // Escuchar actualización de comentario
  socket.on("comment-updated", ({ productId, commentId, text }) => {
    console.log("✏️ Comentario actualizado via socket:", commentId);
    io.to(`product-${productId}`).emit("comment-updated", {
      productId,
      commentId,
      text,
    });
  });

  // Escuchar eliminación de comentario
  socket.on("comment-deleted", ({ productId, commentId }) => {
    console.log("🗑 Comentario eliminado via socket:", commentId);
    io.to(`product-${productId}`).emit("comment-deleted", {
      productId,
      commentId,
    });
  });
  // Escuchar like en comentario
  socket.on("comment-liked", ({ productId, commentId, likes, likedBy }) => {
    console.log("❤️ Comentario likeado via socket:", commentId);
    io.to(`product-${productId}`).emit("comment-liked", {
      productId,
      commentId,
      likes,
      likedBy,
    });
  });

  // Escuchar edición de comentario desde el cliente

  socket.on(
    "delete-comment",
    ({ productId, commentId, userId, commentData }) => {
      try {
        console.log("🗑 Eliminando comentario:", { productId, commentId });

        socket.to(`product-${productId}`).emit("comment-deleted", {
          productId,
          commentId,
          userId,
          timestamp: Date.now(),
        });

        socket.emit("comment-deleted-confirm", {
          productId,
          commentId,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("❌ Error en delete-comment:", error);

        if (commentData) {
          socket.emit("comment-delete-error", {
            productId,
            commentId,
            commentData,
          });
        }
      }
    }
  );

  // Escuchar eliminación de comentario desde el cliente

  socket.on("new-comment", async ({ productId, commentData }) => {
    try {
      console.log("💬 Nuevo comentario recibido:", { productId, commentData });

      // 🔥 VALIDAR QUE TENGA user (ObjectId) NO userId
      if (!commentData.user) {
        console.error("❌ Faltan datos requeridos:", commentData);
        return socket.emit("error", {
          message: "Faltan datos del usuario (user es requerido)",
        });
      }

      // 🔥 CREAR COMENTARIO CON user (ObjectId)
      const newComment = await Comment.create({
        product: productId,
        user: commentData.user, // <-- AQUÍ USAR user, NO userId
        text: commentData.text,
        date: new Date(),
      });

      // Populate user data
      const populatedComment = await Comment.findById(newComment._id).populate(
        "user",
        "username avatarImage email"
      );

      const commentToEmit = {
        _id: populatedComment._id,
        id: populatedComment._id.toString(),
        userId: populatedComment.user?._id?.toString() || commentData.user,
        userName: populatedComment.user?.username || "Usuario",
        userAvatar:
          populatedComment.user?.avatarImage ||
          generateAvatar(populatedComment.user?._id),
        date: populatedComment.date.toISOString().split("T")[0],
        text: populatedComment.text,
        likes: 0,
        likedBy: [],
        replies: [],
      };

      io.to(`product-${productId}`).emit("new-comment", {
        productId,
        comment: commentToEmit,
      });

      console.log(`💬 Nuevo comentario en producto ${productId}`);
    } catch (error) {
      console.error("❌ Error en new-comment:", error);
      console.error("❌ Error details:", error.errors);
      socket.emit("error", {
        message: "Error al crear comentario",
        details: error.message,
      });
    }
  });

  // En server.js, dentro de io.on("connection", ...)
  socket.on(
    "like-comment",
    ({
      productId,
      commentId,
      userId,
      wasLiked,
      previousLikes,
      previousLikedBy,
    }) => {
      try {
        console.log("❤️ Like en comentario:", { productId, commentId, userId });

        const newLikes = wasLiked ? previousLikes - 1 : previousLikes + 1;
        const newLikedBy = wasLiked
          ? previousLikedBy.filter((id) => id !== userId)
          : [...previousLikedBy, userId];

        io.to(`product-${productId}`).emit("comment-liked", {
          productId,
          commentId,
          likes: newLikes,
          likedBy: newLikedBy,
          userId,
          action: wasLiked ? "unliked" : "liked",
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("❌ Error en like-comment:", error);

        socket.emit("comment-like-error", {
          productId,
          commentId,
          likes: previousLikes,
          likedBy: previousLikedBy,
          userId,
        });
      }
    }
  );

  socket.on("edit-review", async ({ productId, reviewId, text, userId }) => {
    try {
      console.log("✏️ Edición de reseña recibida:", {
        productId,
        reviewId,
        text,
      });

      const review = await Review.findById(reviewId);
      if (!review) {
        return socket.emit("review-error", {
          reviewId,
          message: "Reseña no encontrada",
        });
      }

      // Verificar autoría
      if (review.user.toString() !== userId) {
        return socket.emit("review-error", {
          reviewId,
          message: "No autorizado",
        });
      }

      // Actualizar
      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { text: text },
        { new: true, timestamps: false }
      );

      io.to(`product-${productId}`).emit("review-updated", {
        productId,
        reviewId,
        text: updatedReview.text,
      });

      console.log("✅ Reseña actualizada:", reviewId);
    } catch (error) {
      console.error("❌ Error en edit-review:", error);
      socket.emit("review-error", {
        reviewId,
        message: "Error al editar reseña",
      });
    }
  });

  // 🔥 MODIFICA ESTA FUNCIÓN socket.on("reply-comment")
  socket.on(
    "reply-comment",
    ({ productId, commentId, text, userId, tempReplyId }) => {
      try {
        console.log("💬 Respondiendo a comentario:", {
          productId,
          commentId,
          tempReplyId,
        });

        const tempReply = {
          id: tempReplyId,
          userId: userId,
          userName: "Usuario",
          text: text,
          isTemp: true,
          date: new Date().toISOString().split("T")[0],
        };

        io.to(`product-${productId}`).emit("comment-reply-added", {
          productId,
          commentId,
          reply: tempReply,
          sourceSocketId: socket.id,
        });
      } catch (error) {
        console.error("❌ Error en reply-comment:", error);
        socket.emit("reply-error", { tempReplyId, error: error.message });
      }
    }
  );

  socket.on(
    "update-comment",
    ({ productId, commentId, text, userId, previousText }) => {
      try {
        console.log("✏️ Actualizando comentario:", { productId, commentId });

        socket.to(`product-${productId}`).emit("comment-updated", {
          productId,
          commentId,
          text,
          userId,
          timestamp: Date.now(),
        });

        socket.emit("comment-updated-confirm", {
          productId,
          commentId,
          text,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("❌ Error en update-comment:", error);

        socket.emit("comment-update-error", {
          productId,
          commentId,
          previousText,
        });
      }
    }
  );

  socket.on(
    "create-comment",
    async ({ productId, commentData, tempCommentId }) => {
      try {
        console.log("💬 Creando comentario:", { productId, tempCommentId });

        io.to(`product-${productId}`).emit("comment-created", {
          productId,
          comment: {
            id: tempCommentId,
            userId: commentData.userId,
            userName: "Usuario",
            text: commentData.text,
            isTemp: true,
            date: new Date().toISOString().split("T")[0],
            replies: [],
            likes: 0,
            likedBy: [],
          },
          sourceSocketId: socket.id,
        });
      } catch (error) {
        console.error("❌ Error en create-comment:", error);
        socket.emit("comment-error", { tempCommentId, error: error.message });
      }
    }
  );

  socket.on(
    "like-review",
    async ({
      productId,
      reviewId,
      userId,
      wasLiked,
      previousLikes,
      previousLikedBy,
    }) => {
      try {
        console.log("❤️ Like en reseña:", { productId, reviewId, userId });

        const newLikes = wasLiked ? previousLikes - 1 : previousLikes + 1;
        const newLikedBy = wasLiked
          ? previousLikedBy.filter((id) => id !== userId)
          : [...previousLikedBy, userId];

        // Emitir a TODOS
        io.to(`product-${productId}`).emit("review-liked", {
          productId,
          reviewId,
          likes: newLikes,
          likedBy: newLikedBy,
          userId,
          action: wasLiked ? "unliked" : "liked",
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("❌ Error en like-review:", error);

        // Revertir like
        socket.emit("review-like-error", {
          productId,
          reviewId,
          likes: previousLikes,
          likedBy: previousLikedBy,
          userId,
        });

        socket.to(`product-${productId}`).emit("review-like-error", {
          productId,
          reviewId,
          likes: previousLikes,
          likedBy: previousLikedBy,
          sourceUserId: userId,
        });
      }
    }
  );
  socket.on(
    "delete-review",
    async ({ productId, reviewId, userId, reviewData }) => {
      try {
        console.log("🗑 Eliminando reseña:", { productId, reviewId });

        // Emitir a TODOS excepto al emisor
        socket.to(`product-${productId}`).emit("review-deleted", {
          productId,
          reviewId,
          userId,
          timestamp: Date.now(),
        });

        // Confirmación al emisor
        socket.emit("review-deleted-confirm", {
          productId,
          reviewId,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("❌ Error en delete-review:", error);

        // Revertir eliminación
        if (reviewData) {
          socket.emit("review-delete-error", {
            productId,
            reviewId,
            reviewData,
          });

          socket.to(`product-${productId}`).emit("review-delete-error", {
            productId,
            reviewId,
            reviewData,
            sourceUserId: userId,
          });
        }
      }
    }
  );

  // 🔥 AÑADE ESTA FUNCIÓN PARA MANEJAR CONCURRENCIA
  socket.on("cancel-reply", ({ productId, commentId, tempReplyId }) => {
    console.log("🚫 Cancelando respuesta temporal:", tempReplyId);
    // Emitir a todos para que eliminen la respuesta temporal
    socket.to(`product-${productId}`).emit("remove-temp-reply", {
      productId,
      commentId,
      tempReplyId,
    });
  });
  socket.on(
    "update-review",
    async ({ productId, reviewId, text, userId, previousText }) => {
      try {
        console.log("✏️ Actualizando reseña:", { productId, reviewId });

        // Emitir a TODOS excepto al emisor
        socket.to(`product-${productId}`).emit("review-updated", {
          productId,
          reviewId,
          text,
          userId,
          timestamp: Date.now(),
        });

        // También emitir al emisor para confirmación
        socket.emit("review-updated-confirm", {
          productId,
          reviewId,
          text,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("❌ Error en update-review:", error);

        // Notificar error y enviar texto anterior para revertir
        socket.emit("review-update-error", {
          productId,
          reviewId,
          previousText,
        });

        socket.to(`product-${productId}`).emit("review-update-error", {
          productId,
          reviewId,
          previousText,
          sourceUserId: userId,
        });
      }
    }
  );

  socket.on("add-review", async ({ productId, reviewData }) => {
    try {
      console.log("⭐ Nueva reseña recibida via socket:", {
        productId,
        reviewData,
      });

      const { rating, text, userId } = reviewData;

      // Validaciones básicas
      if (!rating || !userId) {
        return socket.emit("review-error", {
          message: "Datos incompletos",
        });
      }

      // Crear la reseña en la base de datos
      const nuevaReview = new Review({
        product: productId,
        user: userId,
        rating: parseInt(rating),
        text: text || "",
        date: new Date(),
        likes: 0,
        likedBy: [],
      });

      await nuevaReview.save();

      // Populate para obtener datos del usuario
      const reviewConUser = await Review.findById(nuevaReview._id).populate({
        path: "user",
        select: "username avatarImage",
        model: "User",
      });

      const reviewToEmit = {
        _id: reviewConUser._id,
        id: reviewConUser._id.toString(),
        userId: reviewConUser.user?._id?.toString() || userId,
        userName: reviewConUser.user?.username || "Usuario",
        userAvatar: reviewConUser.user?.avatarImage || generateAvatar(userId),
        rating: reviewConUser.rating,
        date: reviewConUser.date.toISOString().split("T")[0],
        text: reviewConUser.text || "",
        likes: 0,
        likedBy: [],
        isLiked: false,
      };

      // Emitir a TODOS los clientes en la sala del producto
      io.to(`product-${productId}`).emit("new-review", {
        productId,
        review: reviewToEmit,
      });

      console.log("✅ Reseña emitida a sala product-", productId);
    } catch (error) {
      console.error("❌ Error en add-review:", error);
      socket.emit("review-error", {
        message: "Error al agregar reseña",
      });
    }
  });
  socket.on(
    "create-review",
    async ({ productId, reviewData, tempReviewId }) => {
      try {
        console.log("⭐ Creando reseña:", { productId, tempReviewId });

        // Emitir a TODOS los clientes (incluyendo al emisor para confirmación)
        io.to(`product-${productId}`).emit("review-created", {
          productId,
          review: {
            id: tempReviewId,
            userId: reviewData.userId,
            userName: "Usuario", // Se completará después
            rating: reviewData.rating,
            text: reviewData.text,
            isTemp: true,
            date: new Date().toISOString().split("T")[0],
          },
          sourceSocketId: socket.id,
        });
      } catch (error) {
        console.error("❌ Error en create-review:", error);
        socket.emit("review-error", { tempReviewId, error: error.message });
      }
    }
  );

  // En server.js, dentro de io.on("connection", ...)
  socket.on("new-review", ({ productId, review, isTemp }) => {
    // Emitir a todos en la sala excepto al remitente
    socket.to(`product-${productId}`).emit("new-review-sync", {
      productId,
      review,
      isTemp,
      sourceUserId: socket.userId,
    });
  });

  console.log("✅ Usuario conectado:", socket.id);

  // 4) desconexión
  socket.on("disconnect", () => {
    // borra la entrada del mapa que coincida con este socket.id
    for (const [userId, sId] of global.onlineUsers.entries()) {
      if (sId === socket.id) {
        global.onlineUsers.delete(userId);
        console.log("⛔ Usuario desconectado:", userId);
        break;
      }
    }
  });
});

app.get("/", (req, res) => res.send("Servidor funcionando ✅"));

app.use("/api/users", routerPrincipal);
app.use("/api/products", reseñasProductoRouter);
app.use("/api/categorias", categoriaRoutes);

const PORT = 3005;
server.listen(PORT, () => {
  console.log(
    `🚀 Servidor con Socket.IO y Express corriendo en el puerto ${PORT}`
  );
});
