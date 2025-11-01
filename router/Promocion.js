import Promocion from "../model/Promociones.js";

const registrarPromocion = async (req, res) => {
  try {
    const { codigo, descripcion, descuento, fechaInicio, fechaFin, estado } =
      req.body;

    // 🧹 Limpiar strings
    const cod = codigo?.trimStart().trimEnd().toUpperCase() || "";
    const desc = descripcion?.trimStart().trimEnd() || "";

    // 🛡 Validaciones
    if (!cod || !desc || !descuento || !fechaInicio || !fechaFin) {
      return res
        .status(400)
        .json({ ok: false, msg: "Todos los campos son obligatorios." });
    }

    if (desc.length < 5) {
      return res.status(400).json({
        ok: false,
        msg: "La descripción debe tener al menos 5 caracteres.",
      });
    }

    if (descuento < 1 || descuento > 100) {
      return res
        .status(400)
        .json({ ok: false, msg: "El descuento debe estar entre 1% y 100%." });
    }

    // 🕓 Validar fechas
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (isNaN(inicio) || isNaN(fin) || inicio >= fin) {
      return res
        .status(400)
        .json({ ok: false, msg: "Las fechas de inicio/fin son inválidas." });
    }

    // 🔍 Verificar si ya existe una promoción con ese código
    const promocionExistente = await Promocion.findOne({ codigo: cod });
    if (promocionExistente) {
      return res
        .status(400)
        .json({ ok: false, msg: "El código de promoción ya existe." });
    }

    // 💾 Crear y guardar
    const nuevaPromocion = new Promocion({
      codigo: cod,
      descripcion: desc,
      descuento,
      fechaInicio: inicio,
      fechaFin: fin,
      estado: estado || "activa",
    });

    await nuevaPromocion.save();

    // 📤 Respuesta exitosa
    res.status(201).json({
      ok: true,
      msg: "Promoción registrada correctamente.",
      promocion: nuevaPromocion,
    });
  } catch (error) {
    console.error("❌ Error en registrarPromocion:", error);
    res.status(500).json({
      ok: false,
      msg: "Error del servidor al registrar la promoción.",
    });
  }
};

export default registrarPromocion;
