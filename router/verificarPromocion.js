// startsWith
// includes
// substring

// controllers/verificarPromocion.js
import Promocion from "../model/Promociones.js";

const verificarPromocion = async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return res
        .status(400)
        .json({ ok: false, msg: "El código es obligatorio." });
    }

    const cod = codigo.trim().toUpperCase();

    // 🔍 Buscar promoción por código
    const promo = await Promocion.findOne({ codigo: cod });

    if (!promo) {
      return res.status(404).json({ ok: false, msg: "Código no encontrado." });
    }

    // 📆 Validar fechas
    const hoy = new Date();
    if (hoy < promo.fechaInicio || hoy > promo.fechaFin) {
      return res
        .status(400)
        .json({ ok: false, msg: "La promoción ha expirado o aún no inicia." });
    }

    // ⚙️ Verificar estado
    if (promo.estado !== "activa") {
      return res
        .status(400)
        .json({ ok: false, msg: "Esta promoción no está activa." });
    }

    // ✅ Éxito
    return res.status(200).json({
      ok: true,
      msg: `Promoción válida: ${promo.descripcion}`,
      descuento: promo.descuento,
      promocion: promo,
    });
  } catch (error) {
    console.error("❌ Error al verificar promoción:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error del servidor al verificar la promoción.",
    });
  }
};

export default verificarPromocion;
