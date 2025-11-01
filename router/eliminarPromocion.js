import Promocion from "../model/Promociones.js";

const eliminarPromocion = async (req, res) => {
  try {
    const { id } = req.params;

    const promocionEliminada = await Promocion.findByIdAndDelete(id);

    if (!promocionEliminada) {
      return res.status(404).json({
        ok: false,
        msg: "Promoción no encontrada",
      });
    }

    res.status(200).json({
      ok: true,
      msg: "Promoción eliminada correctamente",
      promocion: promocionEliminada,
    });
  } catch (error) {
    console.error("❌ Error al eliminar promoción:", error);
    res.status(500).json({
      ok: false,
      msg: "Error del servidor al eliminar la promoción",
    });
  }
};

export default eliminarPromocion;
