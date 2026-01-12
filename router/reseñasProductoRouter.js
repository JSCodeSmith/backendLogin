// router/reseñasProducto.js
import express from "express";
import mongoose from "mongoose";
import Producto from "../model/Producto.js";
import Review from "../model/reviewSchema.js";
import { io } from "../index.js";
import Comment from "../model/commentSchema.js";
import { generateAvatar } from "../services/generaciones.js";

const router = express.Router();

const isValidObjectId = (id) => {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    typeof id === "string" &&
    id.length === 24
  );
};

// Obtener reseñas de un producto
router.get("/:productId/reviews", async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId } = req.query;

    console.log("🔍 Buscando reseñas para producto:", productId);

    const producto = await Producto.findById(productId);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const reviews = await Review.find({ product: productId })
      .populate({
        path: "user",
        select: "username email avatarImage",
        model: "User",
      })
      .sort({ date: -1 });

    console.log("✅ Reseñas encontradas:", reviews.length);

    const formattedReviews = reviews.map((review) => {
      const userLiked =
        userId &&
        review.likedBy?.some((id) => id.toString() === userId.toString());

      return {
        _id: review._id,
        id: review._id.toString(),
        userId: review.user?._id?.toString() || review.user?.toString(),
        userName: review.user?.username || "Usuario",
        userAvatar:
          review.user?.avatarImage ||
          generateAvatar(review.user?._id || "default"),
        rating: review.rating,
        date:
          review.date?.toISOString().split("T")[0] ||
          new Date().toISOString().split("T")[0],
        text: review.text || "",
        likes: review.likes || 0,
        likedBy: review.likedBy?.map((id) => id.toString()) || [],
        isLiked: !!userLiked,
      };
    });

    res.json(formattedReviews);
  } catch (error) {
    console.error("🔥 ERROR en GET /reviews:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      message: error.message,
    });
  }
});

// Agregar reseña
// En router/reseñasProductoRouter.js - modificar la ruta POST
router.post("/:productId/reviews", async (req, res) => {
  try {
    console.log("📝 POST /reviews recibido:", req.body);

    const { productId } = req.params;
    const { rating, text, userId } = req.body;

    if (!rating || !userId) {
      return res.status(400).json({
        error: "Datos incompletos",
        required: ["rating", "userId"],
      });
    }

    const producto = await Producto.findById(productId);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Buscar reseña existente
    // const existingReview = await Review.findOne({
    //   product: productId,
    //   user: userId,
    // });

    // let review;

    // if (existingReview) {
    //   // 🔥 ACTUALIZAR reseña existente
    //   console.log("♻ Actualizando reseña existente:", existingReview._id);

    //   existingReview.rating = parseInt(rating);
    //   existingReview.text = text || "";
    //   existingReview.date = new Date(); // Actualizar fecha

    //   await existingReview.save();
    //   review = existingReview;

    //   console.log("✅ Reseña actualizada:", review._id);
    // } else {
    //   // 🔥 CREAR nueva reseña
    //   const nuevaReview = new Review({
    //     product: productId,
    //     user: userId,
    //     rating: parseInt(rating),
    //     text: text || "",
    //     date: new Date(),
    //     likes: 0,
    //     likedBy: [],
    //   });

    //   await nuevaReview.save();
    //   review = nuevaReview;

    //   console.log("✅ Nueva reseña creada:", review._id);
    // }
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
    console.log(
      "💾 Nueva reseña creada (múltiples permitidas):",
      nuevaReview._id
    );

    // Populate después de guardar
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

    // Emitir evento Socket.IO
    if (io) {
      io.to(`product-${productId}`).emit("new-review", {
        productId,
        review: reviewToEmit,
      });
      console.log("📡 Evento new-review emitido");
    }

    res.json({
      success: true,
      review: reviewToEmit,
      message: "Reseña agregada exitosamente",
    });
  } catch (error) {
    console.error("🔥 ERROR en POST /reviews:", error);
    res.status(500).json({
      error: "Error al procesar reseña",
      message: error.message,
    });
  }
});

// Obtener comentarios de un producto
router.get("/:productId/comments", async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId } = req.query; // Para verificar likes

    console.log("🔍 Buscando comentarios para producto:", productId);

    const producto = await Producto.findById(productId);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const comments = await Comment.find({ product: productId })
      .populate({
        path: "user",
        select: "username avatarImage",
        model: "User",
      })
      .populate({
        path: "replies.user",
        select: "username avatarImage",
        model: "User",
      })
      .sort({ date: -1 });

    console.log("✅ Comentarios encontrados:", comments.length);

    const formattedComments = comments.map((comment) => {
      const userLiked =
        userId &&
        comment.likedBy?.some((id) => id.toString() === userId.toString());

      return {
        _id: comment._id,
        id: comment._id.toString(),
        userId: comment.user?._id?.toString() || comment.user?.toString(),
        userName: comment.user?.username || "Usuario",
        userAvatar:
          comment.user?.avatarImage ||
          generateAvatar(comment.user?._id || "default"),
        date:
          comment.date?.toISOString().split("T")[0] ||
          new Date().toISOString().split("T")[0],
        text: comment.text || "",
        likes: comment.likes || 0,
        likedBy: comment.likedBy?.map((id) => id.toString()) || [],
        isLiked: !!userLiked,
        replies: (comment.replies || []).map((reply) => ({
          _id: reply._id,
          id: reply._id.toString(),
          userId: reply.user?._id?.toString() || reply.user?.toString(),
          userName: reply.user?.username || "Usuario",
          userAvatar:
            reply.user?.avatarImage ||
            generateAvatar(reply.user?._id || "default"),
          date:
            reply.date?.toISOString().split("T")[0] ||
            new Date().toISOString().split("T")[0],
          text: reply.text || "",
        })),
      };
    });

    res.json(formattedComments);
  } catch (error) {
    console.error("🔥 ERROR en GET /comments:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      message: error.message,
    });
  }
});

// Agregar comentario

// Dar like a reseña
router.post("/:productId/reviews/:reviewId/like", async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const { userId } = req.body;

    console.log("❤️ Like recibido:", { reviewId, userId, productId });

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId es requerido",
      });
    }
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Reseña no encontrada",
      });
    }
    const userIdStr = userId.toString();
    const isLiked = review.likedBy.some((id) => id.toString() === userIdStr);

    console.log("🔍 Estado actual:", {
      likes: review.likes,
      likedBy: review.likedBy,
      isLiked,
      userIdStr,
    });

    if (isLiked) {
      // Quitar like
      review.likes = Math.max(0, review.likes - 1);
      review.likedBy = review.likedBy.filter(
        (id) => id.toString() !== userIdStr
      );
    } else {
      // Dar like
      review.likes++;
      review.likedBy.push(userId);
    }

    await review.save();

    console.log("💾 Like guardado:", {
      likes: review.likes,
      likedBy: review.likedBy,
    });

    // Socket.IO
    if (io) {
      io.to(`product-${productId}`).emit("review-liked", {
        productId,
        reviewId: review._id.toString(),
        likes: review.likes,
        likedBy: review.likedBy.map((id) => id.toString()),
      });
      console.log("📡 Evento Socket.IO emitido");
    }

    res.json({
      success: true,
      likes: review.likes,
      isLiked: !isLiked,
      message: isLiked ? "Like removido" : "Like agregado",
    });
  } catch (error) {
    console.error("🔥 ERROR en POST /like:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      message: error.message,
    });
  }
});

// Editar reseña
router.put("/:productId/reviews/:reviewId", async (req, res) => {
  try {
    const { text, userId } = req.body; // ← Asegúrate de recibir userId
    const { reviewId, productId } = req.params;

    console.log("📝 Editando reseña:", { reviewId, userId, text });

    if (!isValidObjectId(reviewId)) {
      console.log(
        "⚠️ ID no es ObjectId válido, manejando como temporal:",
        reviewId
      );
      return res.json({
        success: true,
        message: "Reseña temporal actualizada (solo local)",
        review: {
          _id: reviewId,
          text: text,
          user: userId,
        },
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Reseña no encontrada" });
    }

    // Verificar que el usuario sea el dueño de la reseña
    if (review.user.toString() !== userId.toString()) {
      console.log("🚫 No autorizado:", {
        reviewUserId: review.user.toString(),
        requestUserId: userId.toString(),
      });
      return res.status(403).json({
        error: "No autorizado para editar esta reseña",
      });
    }

    review.text = text;
    await review.save();

    if (io) {
      io.to(`product-${productId}`).emit("review-updated", {
        productId,
        reviewId: review._id.toString(), // ← Enviar como string
        text,
      });
    }

    res.json({
      success: true,
      message: "Reseña actualizada",
      review,
    });
  } catch (error) {
    console.error("❌ Error en PUT /reviews:", error);
    res.status(500).json({
      error: "Error al actualizar reseña",
      details: error.message,
    });
  }
});

// Eliminar reseña
router.delete("/:productId/reviews/:reviewId", async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const { userId } = req.body;

    console.log("🗑 Eliminando reseña:", { reviewId, userId });

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Reseña no encontrada" });
    }

    // Verificar que el usuario sea el dueño
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        error: "No autorizado para eliminar esta reseña",
      });
    }

    if (review.product.toString() !== productId) {
      return res.status(400).json({
        error: "La reseña no pertenece a este producto",
      });
    }

    await Review.findByIdAndDelete(reviewId);

    if (io) {
      io.to(`product-${productId}`).emit("review-deleted", {
        productId,
        reviewId: review._id.toString(), // ← String
      });
    }

    res.json({
      success: true,
      message: "Reseña eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /reviews:", error);
    res.status(500).json({ error: "Error al eliminar reseña" });
  }
});

router.post("/:productId/comments/:commentId/reply", async (req, res) => {
  try {
    const { text, userId } = req.body;
    const { productId, commentId } = req.params;

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        error: "ID de comentario inválido",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        error: "ID de usuario inválido",
      });
    }

    if (!text || !userId) {
      return res.status(400).json({ error: "Texto y userId son requeridos" });
    }

    // 🔥 VERIFICAR SI YA EXISTE UNA RESPUESTA IDÉNTICA RECIENTEMENTE
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    // Prevenir respuestas duplicadas (mismo usuario, mismo texto en las últimas 5 minutos)
    const recentDuplicate = comment.replies?.find((reply) => {
      const isRecent = new Date() - new Date(reply.date) < 5 * 60 * 1000; // 5 minutos
      return (
        reply.user.toString() === userId && reply.text === text && isRecent
      );
    });

    if (recentDuplicate) {
      return res.status(400).json({
        success: false,
        error: "Ya has enviado esta respuesta recientemente",
      });
    }

    // 🔥 OPERACIÓN ATÓMICA
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const newReply = {
        user: userId,
        text: text,
        date: new Date(),
        _id: new mongoose.Types.ObjectId(),
      };

      const updatedComment = await Comment.findOneAndUpdate(
        { _id: commentId, product: productId },
        { $push: { replies: newReply } },
        {
          new: true,
          session,
          runValidators: true,
        }
      ).populate({
        path: "replies.user",
        select: "username avatarImage",
        model: "User",
      });

      if (!updatedComment) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: "Comentario no encontrado" });
      }

      await session.commitTransaction();
      session.endSession();

      const addedReply = updatedComment.replies.find(
        (r) => r._id.toString() === newReply._id.toString()
      );

      res.json({
        success: true,
        reply: {
          id: addedReply._id,
          userId: addedReply.user?._id || userId,
          userName: addedReply.user?.username || "Usuario",
          userAvatar: addedReply.user?.avatarImage || "",
          date: addedReply.date.toISOString().split("T")[0],
          text: addedReply.text,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error en POST /reply:", error);
    res.status(500).json({
      success: false,
      error: "Error al agregar respuesta",
      message: error.message,
    });
  }
});
// Editar comentario
router.put("/:productId/comments/:commentId", async (req, res) => {
  try {
    const { text, user } = req.body; // 🔥 Recibir 'user'
    const { commentId, productId } = req.params;

    // Validación de ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(commentId);
    if (!isValidObjectId) {
      return res.json({
        success: true,
        message: "Comentario temporal actualizado (solo local)",
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    // Verificar autorización (igual que reseñas)
    if (comment.user.toString() !== user.toString()) {
      return res.status(403).json({
        error: "No autorizado para editar este comentario",
      });
    }

    // Verificar pertenencia al producto
    if (comment.product.toString() !== productId) {
      return res.status(400).json({
        error: "El comentario no pertenece a este producto",
      });
    }

    comment.text = text;
    await comment.save();

    // Socket.IO
    if (io) {
      io.to(`product-${productId}`).emit("comment-updated", {
        productId,
        commentId: comment._id.toString(),
        text,
      });
    }

    res.json({
      success: true,
      message: "Comentario actualizado",
      comment: {
        id: comment._id.toString(),
        text: comment.text,
      },
    });
  } catch (error) {
    console.error("❌ Error en PUT /comments:", error);
    res.status(500).json({
      error: "Error al actualizar comentario",
      details: error.message,
    });
  }
});

// Eliminar comentario
router.delete("/:productId/comments/:commentId", async (req, res) => {
  try {
    const { user } = req.body; // 🔥 Recibir 'user'
    const { commentId, productId } = req.params;

    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.json({
        success: true,
        message: "Comentario temporal eliminado",
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    // Verificar autorización (igual que reseñas)
    if (comment.user.toString() !== user.toString()) {
      return res.status(403).json({
        error: "No autorizado para eliminar este comentario",
      });
    }

    // Verificar pertenencia al producto
    if (comment.product.toString() !== productId) {
      return res.status(400).json({
        error: "El comentario no pertenece a este producto",
      });
    }

    await Comment.findByIdAndDelete(commentId);

    // Socket.IO
    if (io) {
      io.to(`product-${productId}`).emit("comment-deleted", {
        productId,
        commentId: comment._id.toString(),
      });
    }

    res.json({
      success: true,
      message: "Comentario eliminado exitosamente",
    });
  } catch (error) {
    console.error("❌ Error en DELETE /comments:", error);
    res.status(500).json({
      error: "Error al eliminar comentario",
      details: error.message,
    });
  }
});

router.post("/:productId/comments", async (req, res) => {
  try {
    console.log("=".repeat(50));
    console.log("🔥 BACKEND - NUEVO COMENTARIO");
    console.log("📦 Body recibido:", req.body);

    // 🔥 OBTENER productId DE LOS PARÁMETROS
    const { productId } = req.params;
    const { text, user } = req.body;

    console.log("📝 Intentando agregar comentario para producto:", productId);
    console.log("Datos recibidos:", { text, user });

    if (!text || !user) {
      return res.status(400).json({
        error: "Texto y usuario (user) son requeridos",
      });
    }

    const producto = await Producto.findById(productId);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const nuevoComment = new Comment({
      product: productId,
      user: user,
      text: text,
      date: new Date(),
      replies: [],
      likes: 0,
      likedBy: [],
    });

    await nuevoComment.save();
    console.log("💾 Comentario guardado exitosamente:", nuevoComment._id);

    // Populate después de guardar
    const commentConUser = await Comment.findById(nuevoComment._id).populate({
      path: "user",
      select: "username avatarImage",
      model: "User",
    });

    const commentToEmit = {
      _id: commentConUser._id,
      id: commentConUser._id.toString(),
      userId: commentConUser.user?._id?.toString() || user,
      userName: commentConUser.user?.username || "Usuario",
      userAvatar: commentConUser.user?.avatarImage || generateAvatar(user),
      date: commentConUser.date.toISOString().split("T")[0],
      text: commentConUser.text,
      likes: 0,
      likedBy: [],
      isLiked: false,
      replies: [],
    };

    // Emitir evento Socket.IO si está disponible
    if (io) {
      io.to(`product-${productId}`).emit("new-comment", {
        productId,
        comment: commentToEmit,
      });
      console.log("📡 Evento new-comment emitido");
    }

    res.json({
      success: true,
      comment: commentToEmit,
      message: "Comentario agregado exitosamente",
    });
  } catch (error) {
    console.error("🔥 ERROR en POST /comments:", error);
    res.status(500).json({
      error: "Error al agregar comentario",
      details: error.message,
    });
  }
});

// Dar like a comentario
// En router/reseñasProductoRouter.js
router.post("/:productId/comments/:commentId/like", async (req, res) => {
  try {
    const { user } = req.body; // 🔥 Recibir 'user'
    const { commentId, productId } = req.params;

    if (!user) {
      return res.status(400).json({ error: "Usuario (user) es requerido" });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    // Verificar pertenencia al producto
    if (comment.product.toString() !== productId) {
      return res.status(400).json({
        error: "El comentario no pertenece a este producto",
      });
    }

    // Lógica de like (igual que reseñas)
    const userIdStr = user.toString();
    const isLiked = comment.likedBy.some((id) => id.toString() === userIdStr);

    if (isLiked) {
      // Quitar like
      comment.likes = Math.max(0, comment.likes - 1);
      comment.likedBy = comment.likedBy.filter(
        (id) => id.toString() !== userIdStr
      );
    } else {
      // Dar like
      comment.likes++;
      comment.likedBy.push(user);
    }

    await comment.save();

    // Socket.IO
    if (io) {
      io.to(`product-${productId}`).emit("comment-liked", {
        productId,
        commentId: comment._id.toString(),
        likes: comment.likes,
        likedBy: comment.likedBy.map((id) => id.toString()),
      });
    }

    res.json({
      success: true,
      likes: comment.likes,
      isLiked: !isLiked,
      likedBy: comment.likedBy.map((id) => id.toString()),
      message: isLiked ? "Like removido" : "Like agregado",
    });
  } catch (error) {
    console.error("Error en POST /comments/like:", error);
    res.status(500).json({
      error: "Error al dar like",
      details: error.message,
    });
  }
});

export default router;
