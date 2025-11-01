import Pedido from "../model/Pedido.js";
import mongoose from "mongoose";

const eliminarPedido = async (req, res) => {
  try {
    // 1️⃣ Tomamos el ID desde el body o los params
    let { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        msg: "ID no válido",
      });
    }
    // 2️⃣ Limpiamos espacios al inicio y final (por si vienen en la URL)
    id = id.trimStart().trimEnd();
    // 3️⃣ Buscamos y eliminamos el pedido
    const pedidoEliminado = await Pedido.findOneAndDelete({ _id: id });
    // 4️⃣ Si no se encontró
    if (!pedidoEliminado) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Pedido no encontrado" });
    }
    return res.status(200).json({
      ok: true,
      mensaje: "Pedido eliminado correctamente",
      pedido: pedidoEliminado,
    });
  } catch (error) {
    // 6️⃣ Capturamos errores
    console.error("Error al eliminar el pedido:", error);
    return res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

export default eliminarPedido;
