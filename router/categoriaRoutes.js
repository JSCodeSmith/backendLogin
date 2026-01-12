import express from "express";
import Categoria from "../model/Categoria.js";
import { io } from "../index.js"; // Asegúrate de exportar io desde server.js
import mongoose from "mongoose";

const router = express.Router();

// Obtener todas las categorías
router.get("/", async (req, res) => {
  try {
    const categorias = await Categoria.find({ esActiva: true }).sort({
      orden: 1,
      nombre: 1,
    });
    res.json({ success: true, categorias });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID sea un ObjectId de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "ID de categoría inválido",
      });
    }

    const categoria = await Categoria.findById(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: "Categoría no encontrada",
      });
    }

    res.json({
      success: true,
      categoria,
    });
  } catch (error) {
    console.error("❌ Error en GET /:id:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Crear categoría
router.post("/", async (req, res) => {
  try {
    const nuevaCategoria = await Categoria.create(req.body);

    // Emitir a todos los clientes
    if (io) {
      io.emit("categoriaCreada", nuevaCategoria);
    }

    res.json({ success: true, categoria: nuevaCategoria });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar categoría
router.put("/:id", async (req, res) => {
  try {
    const categoriaActualizada = await Categoria.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!categoriaActualizada) {
      return res
        .status(404)
        .json({ success: false, error: "Categoría no encontrada" });
    }

    // Emitir a todos los clientes
    if (io) {
      io.emit("categoriaActualizada", categoriaActualizada);
    }

    res.json({ success: true, categoria: categoriaActualizada });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar categoría
router.delete("/:id", async (req, res) => {
  try {
    const categoriaEliminada = await Categoria.findByIdAndDelete(req.params.id);

    if (!categoriaEliminada) {
      return res
        .status(404)
        .json({ success: false, error: "Categoría no encontrada" });
    }

    // Emitir a todos los clientes
    if (io) {
      io.emit("categoriaEliminada", { _id: req.params.id });
    }

    res.json({ success: true, message: "Categoría eliminada" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
