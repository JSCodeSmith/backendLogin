import Venta from "../model/ventaSchema.js";
import Pedido from "../model/Pedido.js"; // Asegúrate de tener este modelo

const ventas = async (req, res) => {
  try {
    const anio = req.params.anio;
    const inicioAnio = new Date(`${anio}-01-01`);
    const finAnio = new Date(`${anio}-12-31`);

    // ===== Total anual =====
    const totalAnualResult = await Venta.aggregate([
      { $match: { fecha: { $gte: inicioAnio, $lte: finAnio } } },
      { $group: { _id: null, total: { $sum: "$monto" } } },
    ]);
    const totalAnual = totalAnualResult[0]?.total || 0;

    // ===== Promedio mensual =====
    const mensualResult = await Venta.aggregate([
      { $match: { fecha: { $gte: inicioAnio, $lte: finAnio } } },
      {
        $group: {
          _id: { mes: { $month: "$fecha" } },
          totalMes: { $sum: "$monto" },
        },
      },
    ]);
    const meses = Array(12).fill(0);
    mensualResult.forEach((m) => {
      meses[m._id.mes - 1] = m.totalMes;
    });
    const promedioMensual = mensualResult.length
      ? mensualResult.reduce((a, b) => a + b.totalMes, 0) / mensualResult.length
      : 0;

    // ===== Última venta =====
    const ultimaVenta = await Venta.findOne().sort({ fecha: -1 }).limit(1);

    // ===== Ventas por categoría =====
    const ventasPorCategoriaResult = await Venta.aggregate([
      { $group: { _id: "$categoria", total: { $sum: "$monto" } } },
    ]);
    const ventasPorCategoria = ventasPorCategoriaResult.map((v) => ({
      categoria: v._id,
      total: v.total,
    }));

    // ===== Pedidos por estado =====
    const pedidosEstadoResult = await Pedido.aggregate([
      { $group: { _id: "$estado", total: { $sum: 1 } } },
    ]);
    const pedidosEstado = { entregados: 0, pendientes: 0, cancelados: 0 };
    pedidosEstadoResult.forEach((p) => {
      pedidosEstado[p._id.toLowerCase()] = p.total;
    });

    // ===== Construir gráfico mensual =====
    const grafico = {
      labels: [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ],
      data: meses,
    };

    res.json({
      totalAnual,
      promedioMensual,
      ultimaVenta,
      ventasPorCategoria,
      grafico,
      pedidosEstado,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error obteniendo resumen de ventas" });
  }
};

export default ventas;
