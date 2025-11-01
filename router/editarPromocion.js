import mongoose from "mongoose";
import Promocion from "../model/Promociones.js";

const editarPromocion = async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ ok: false, msg: "ID inválido" });
  }

  try {
    // Campos permitidos
    const campos = [
      "codigo",
      "descripcion",
      "descuento",
      "fechaInicio",
      "fechaFin",
      "estado",
    ];
    const updateData = {};

    campos.forEach((campo) => {
      if (body[campo] !== undefined && body[campo] !== null) {
        if (campo === "descuento") {
          const n = Number(body[campo]);
          // Forzamos tipo número y rango 0-100
          updateData[campo] = isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
        } else {
          updateData[campo] = body[campo];
        }
      }
    });

    console.log("Datos a actualizar:", updateData); // 🔹 depuración

    const promo = await Promocion.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true, // asegura que min/max se cumpla
    });

    if (!promo) {
      return res
        .status(404)
        .json({ ok: false, msg: "Promoción no encontrada" });
    }

    return res.json({
      ok: true,
      msg: "Promoción editada correctamente",
      promo,
    });
  } catch (err) {
    console.error("❌ Error al editar promoción:", err);
    return res.status(500).json({ ok: false, msg: err.message });
  }
};

export default editarPromocion;
