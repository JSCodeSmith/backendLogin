// controlador/pedidosController.js
import Pedido from "../model/Pedido.js";

const verPedidoDetalles = async (req, res) => {
  try {
    // 1️⃣ Capturamos el ID del pedido
    let { id } = req.params;

    id = id.trimStart().trimEnd();

    //   // 2️⃣ Buscamos el pedido y (si está relacionado) poblamos los productos
    const pedido = await Pedido.findById(id).populate("productos.productoId");

    //   // 3️⃣ Si no se encuentra
    if (!pedido) {
      return res.status(404).json({ mensaje: "Pedido no encontrado" });
    }

    //   // 4️⃣ Si se encuentra, devolvemos los detalles
    return res.status(200).json({
      mensaje: "Detalles del pedido",
      pedido,
    });
  } catch (error) {
    console.error("Error al obtener detalles del pedido:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

export default verPedidoDetalles;
