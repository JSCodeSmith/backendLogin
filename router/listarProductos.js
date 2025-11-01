// import Producto from "../model/Producto.js";

// const listarProductos = async (req, res) => {
//   try {
//     // Puedes usar limit() para limitar la cantidad y select() para elegir campos
//     const productos = await Producto.find()
//       .select("nombre categoria precio stock") // sólo estos campos
//       .limit(50); // máximo 50 resultados (por ejemplo)

//     return res.status(200).json(productos);
//   } catch (error) {
//     console.error("Error al listar productos:", error);
//     return res.status(500).json({ message: "Error al listar productos." });
//   }
// };

// export default listarProductos;

import Producto from "../model/Producto.js";

const listarProductos = async (req, res) => {
  try {
    const productos = await Producto.find().sort({ fechaCreacion: -1 });
    res.json(productos);
  } catch (error) {
    console.error("❌ Error al listar productos:", error);
    res.status(500).json({ message: "Error al listar productos" });
  }
};

export default listarProductos;
