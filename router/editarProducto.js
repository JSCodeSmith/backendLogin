import fs from "fs";
import path from "path";
import { io } from "../index.js";
import Producto from "../model/Producto.js";
import cloudinary from "cloudinary";

// ✅ Configurar Cloudinary (usa variables de entorno)
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Define el modo (cloud o local)
const MODO_IMAGEN = process.env.MODO_IMAGEN || "cloud";

const editarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔍 Buscar producto
    const producto = await Producto.findById(id);
    if (!producto)
      return res.status(404).json({ message: "Producto no encontrado." });

    // 🔹 Normalizar y validar campos
    const nombre = req.body.nombre?.trim();
    const descripcion = req.body.descripcion?.trim();
    const categoria = req.body.categoria?.trim();
    const precio = Number(req.body.precio);
    const stock = Number(req.body.stock);

    if (!nombre || !categoria || isNaN(precio) || isNaN(stock))
      return res
        .status(400)
        .json({ message: "Datos inválidos o incompletos." });

    // 🔹 Verificar duplicado (excepto el mismo producto)
    const duplicado = await Producto.findOne({
      nombre,
      _id: { $ne: id },
    });
    if (duplicado)
      return res
        .status(400)
        .json({ message: "Ya existe otro producto con ese nombre." });

    let nuevaImagen = producto.imagen; // mantener anterior si no se sube nueva

    // 🔹 Procesar nueva imagen si se subió
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname).toLowerCase();

      // Validar formato
      if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        file.path;
        return res
          .status(400)
          .json({ message: "Formato de imagen no permitido." });
      }

      // Validar tamaño
      if (file.size > 5 * 1024 * 1024) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        file.path;
        return res
          .status(400)
          .json({ message: "Imagen demasiado grande (máx. 5MB)." });
      }

      // 🔹 Eliminar imagen anterior (según origen)
      if (producto.imagen) {
        try {
          if (producto.imagen.startsWith("http")) {
            // 🌩️ Imagen en Cloudinary
            const partes = producto.imagen.split("/");
            const archivo = partes[partes.length - 1];
            const nombrePublico = archivo.split(".")[0];
            await cloudinary.v2.uploader.destroy(`productos/${nombrePublico}`);
            console.log("🧹 Imagen anterior eliminada de Cloudinary");
          } else {
            // 💾 Imagen local
            const rutaVieja = path.join("uploads", producto.imagen);
            if (fs.existsSync(rutaVieja)) {
              if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
              rutaVieja;
              console.log("🧹 Imagen local eliminada:", rutaVieja);
            }
          }
        } catch (err) {
          console.warn("⚠️ No se pudo eliminar imagen anterior:", err.message);
        }
      }

      // 🔹 Subir nueva imagen según modo
      if (MODO_IMAGEN === "cloud") {
        try {
          const subida = await cloudinary.v2.uploader.upload(file.path, {
            folder: "productos",
            resource_type: "image",
          });
          nuevaImagen = subida.secure_url;
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          file.path; // elimina el temporal
          console.log("☁️ Imagen subida a Cloudinary");
        } catch (err) {
          console.error("❌ Error al subir a Cloudinary:", err.message);
          return res
            .status(500)
            .json({ message: "Error al subir imagen a Cloudinary." });
        }
      } else {
        try {
          const nombreArchivo =
            nombre.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now() + ext;
          const nuevaRuta = path.join("uploads", nombreArchivo);
          fs.renameSync(file.path, nuevaRuta);
          nuevaImagen = nombreArchivo;
          console.log("💾 Imagen guardada localmente:", nuevaImagen);
        } catch (err) {
          console.error("❌ Error al guardar imagen local:", err.message);
          return res
            .status(500)
            .json({ message: "Error al guardar imagen local." });
        }
      }
    }

    // 🔹 Actualizar producto
    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      {
        nombre,
        descripcion,
        categoria,
        precio,
        stock,
        imagen: nuevaImagen,
        fechaActualizacion: new Date(),
      },
      { new: true, runValidators: true }
    );

    io.emit("ActualizadoProducto", productoActualizado);

    res.status(200).json({
      message: "Producto actualizado correctamente.",
      producto: productoActualizado,
    });
  } catch (error) {
    console.error("❌ Error al editar producto:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

export default editarProducto;
