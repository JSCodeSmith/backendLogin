// controllers/categoriaController.js
import Categoria from "../model/Categoria.js";
import Producto from "../model/Producto.js";

// Obtener todas las categorías activas
export const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find({ esActiva: true })
      .sort({ orden: 1, nombre: 1 })
      .select("-fechaCreacion -fechaActualizacion");

    res.json({
      success: true,
      categorias,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener categorías",
      error: error.message,
    });
  }
};

// Obtener categoría por ID
export const obtenerCategoriaPorId = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    res.json({
      success: true,
      categoria,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener categoría",
      error: error.message,
    });
  }
};

// Crear nueva categoría (solo admin)
export const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, imagen, icono, color, orden } = req.body;

    // Verificar si ya existe
    const existeCategoria = await Categoria.findOne({ nombre });
    if (existeCategoria) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una categoría con ese nombre",
      });
    }

    const nuevaCategoria = new Categoria({
      nombre,
      descripcion: descripcion || "",
      imagen: imagen || "",
      icono: icono || "📦",
      color: color || "#4F46E5",
      orden: orden || 0,
    });

    await nuevaCategoria.save();

    res.status(201).json({
      success: true,
      message: "Categoría creada exitosamente",
      categoria: nuevaCategoria,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear categoría",
      error: error.message,
    });
  }
};

// Actualizar categoría (solo admin)
export const actualizarCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, imagen, icono, color, orden, esActiva } =
      req.body;

    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    // Si se cambia el nombre, verificar que no exista otra con ese nombre
    if (nombre && nombre !== categoria.nombre) {
      const existeCategoria = await Categoria.findOne({
        nombre,
        _id: { $ne: req.params.id },
      });

      if (existeCategoria) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otra categoría con ese nombre",
        });
      }
    }

    // Actualizar campos
    if (nombre) categoria.nombre = nombre;
    if (descripcion !== undefined) categoria.descripcion = descripcion;
    if (imagen !== undefined) categoria.imagen = imagen;
    if (icono !== undefined) categoria.icono = icono;
    if (color !== undefined) categoria.color = color;
    if (orden !== undefined) categoria.orden = orden;
    if (esActiva !== undefined) categoria.esActiva = esActiva;

    await categoria.save();

    res.json({
      success: true,
      message: "Categoría actualizada exitosamente",
      categoria,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar categoría",
      error: error.message,
    });
  }
};

// Eliminar categoría (solo admin)
export const eliminarCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    // Verificar si la categoría tiene productos
    if (categoria.cantidadProductos > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar la categoría porque tiene productos asociados",
      });
    }

    await categoria.deleteOne();

    res.json({
      success: true,
      message: "Categoría eliminada exitosamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar categoría",
      error: error.message,
    });
  }
};

// Obtener productos por categoría
export const obtenerProductosPorCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    const productos = await Producto.find({
      categoria: req.params.id,
      esActivo: true,
    })
      .populate("categoria", "nombre icono color")
      .sort({ fechaCreacion: -1 });

    res.json({
      success: true,
      categoria,
      productos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener productos por categoría",
      error: error.message,
    });
  }
};
