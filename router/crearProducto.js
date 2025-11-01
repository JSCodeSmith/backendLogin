// import Producto from "../model/Producto.js";

// const crearProducto = async (req, res) => {
//   try {
//     const nombre = req.body.nombre?.trimStart().trimEnd();
//     const categoria = req.body.categoria?.trimStart().trimEnd();
//     const descripcion = req.body.descripcion?.trimStart().trimEnd();
//     const precio = Number(req.body.precio);
//     const stock = Number(req.body.stock);
//     const imagen = req.file?.path || req.file?.secure_url || null;
//     console.log("📸 req.file:", req.file);

//     if (!nombre || !categoria || isNaN(precio) || isNaN(stock)) {
//       return res
//         .status(400)
//         .json({ message: "Datos incompletos o inválidos." });
//     }

//     const productoExistente = await Producto.findOne({
//       nombre: { $regex: new RegExp(`^${nombre}$`, "i") },
//     });
//     if (productoExistente) {
//       return res.status(400).json({ message: "El producto ya existe." });
//     }

//     const nuevoProducto = await Producto.create({
//       nombre,
//       categoria,
//       descripcion,
//       precio,
//       stock,
//       imagen,
//       fechaCreacion: new Date(),
//     });

//     console.log("✅ Producto guardado en MongoDB y Cloudinary");
//     console.log(nuevoProducto); // JSON.stringify

//     return res.status(201).json(nuevoProducto);
//   } catch (error) {
//     console.error("❌ Error al crear producto:", error);
//     return res.status(500).json({
//       message: "Error interno del servidor",
//       error: error.message || error.toString(),
//     });
//   }
// };

// export default crearProducto;

// controllers/crearProducto.js
import Producto from "../model/Producto.js";
import { io } from "../index.js";

const crearProducto = async (req, res) => {
  try {
    // Logs para depuración clara
    console.log("🧾 req.body:", req.body);
    console.log("📸 req.file:", req.file);

    // Recuperar campos
    const nombre = (req.body.nombre || "").toString().trim();
    const categoria = (req.body.categoria || "").toString().trim();
    const descripcion = (req.body.descripcion || "").toString().trim();
    const precio = Number(req.body.precio);
    const stock = Number(req.body.stock);

    // Aceptar varias formas en que multer/cloudinary puede devolver la URL
    const imagen =
      req.file?.path || // algunos setups devuelven path
      req.file?.secure_url || // cloudinary old
      req.file?.url || // a veces url
      req.file?.filename || // fallback: filename (no es URL)
      null;

    // Validaciones básicas
    if (!nombre || !categoria || isNaN(precio) || isNaN(stock)) {
      return res
        .status(400)
        .json({ message: "Datos incompletos o inválidos." });
    }

    // Evitar duplicados (case-insensitive)
    const productoExistente = await Producto.findOne({
      nombre: { $regex: new RegExp(`^${nombre}$`, "i") },
    });
    if (productoExistente) {
      return res.status(400).json({ message: "El producto ya existe." });
    }

    // Normalizar nombre de imagen si es posible
    if (imagen)
      req.file.filename = nombre
        .split(".")[0]
        .replace(/\s+/g, "_")
        .replace(/[^\w\-]/g, "");
    const nuevoProducto = await Producto.create({
      nombre,
      categoria,
      descripcion,
      precio,
      stock,
      imagen,
      fechaCreacion: new Date(),
    });

    console.log("✅ Producto guardado en MongoDB y Cloudinary:");
    console.log(JSON.stringify(nuevoProducto, null, 2));

    // 🔥 Emitir evento en tiempo real

    io.emit("nuevoProducto", nuevoProducto);

    return res.status(201).json(nuevoProducto);
  } catch (err) {
    // Mostrar error legible en consola
    console.error("❌ Error al crear producto:", err?.message || err);
    console.error(err);

    // Responder JSON claro para el frontend
    return res.status(500).json({
      message: "Error interno del servidor al crear producto",
      error: err?.message || String(err),
    });
  }
};

export default crearProducto;
