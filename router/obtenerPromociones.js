import Promocion from "../model/Promociones.js";

const obtenerPromociones = async (req, res) => {
  try {
    // Buscar todas las promociones activas y mostrar solo ciertos campos
    const promociones = await Promocion.find()
      .select("codigo descripcion descuento estado fechaInicio fechaFin")
      .limit(10); // muestra solo las primeras 10

    res.status(200).json({
      ok: true,
      total: promociones.length,
      promociones,
    });
  } catch (error) {
    console.error("❌ Error al obtener promociones:", error);
    res.status(500).json({
      ok: false,
      msg: "Error del servidor al obtener las promociones.",
    });
  }
};

export default obtenerPromociones;
