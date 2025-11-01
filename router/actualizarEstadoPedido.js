import Pedido from "../model/Pedido.js";

const actualizarEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const pedido = await Pedido.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    );
    if (!pedido)
      return res.status(404).json({ mensaje: "Pedido no encontrado" });
    res.json({ ok: true, pedido });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export default actualizarEstadoPedido;
