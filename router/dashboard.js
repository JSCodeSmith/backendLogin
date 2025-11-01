import express from "express";
import Pedido from "../model/Pedido.js";

// Simulación de base de datos
const ventas = [
  { mes: "Enero", monto: 12000, categoria: "Electrónica" },
  { mes: "Febrero", monto: 15000, categoria: "Electrodomésticos" },
  { mes: "Marzo", monto: 11000, categoria: "Electrónica" },
  { mes: "Abril", monto: 18000, categoria: "Ropa" },
  { mes: "Mayo", monto: 22000, categoria: "Electrónica" },
  { mes: "Junio", monto: 19500, categoria: "Ropa" },
  { mes: "Julio", monto: 21000, categoria: "Electrónica" },
  { mes: "Agosto", monto: 25000, categoria: "Electrodomésticos" },
  { mes: "Setiembre", monto: 23000, categoria: "Ropa" },
  { mes: "Octubre", monto: 27000, categoria: "Ropa" },
  { mes: "Noviembre", monto: 31000, categoria: "Electrónica" },
  { mes: "Diciembre", monto: 34000, categoria: "Electrodomésticos" },
];

// Función para procesar los datos
async function generarResumen() {
  try {
    const pedidos = await Pedido.find();

    if (pedidos.length === 0) {
      return { message: "No hay pedidos registrados" };
    }

    // 🔹 Total anual
    const totalAnual = pedidos.reduce((a, v) => a + v.total, 0);

    // 🔹 Agrupar por mes
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Setiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const ventasPorMes = Array(12).fill(0);
    pedidos.forEach((p) => {
      const mes = new Date(p.createdAt).getMonth(); // 0–11
      ventasPorMes[mes] += p.total;
    });

    // 🔹 Promedio, máximo y mínimo
    const promedio = totalAnual / 12;
    const max = Math.max(...ventasPorMes);
    const min = Math.min(...ventasPorMes);
    const mesMax = meses[ventasPorMes.indexOf(max)];
    const mesMin = meses[ventasPorMes.indexOf(min)];

    // 🔹 Último pedido
    const ultimaVenta = pedidos.at(-1);

    // 🔹 Contar pedidos por estado (en minúsculas)
    const pedidosEstado = {
      entregados: pedidos.filter((p) => p.estado === "entregado").length,
      pendientes: pedidos.filter((p) => p.estado === "pendiente").length,
      cancelados: pedidos.filter((p) => p.estado === "cancelado").length,
    };

    return {
      totalAnual: totalAnual.toLocaleString("es-PE", {
        style: "currency",
        currency: "PEN",
      }),
      promedioMensual: promedio.toFixed(2),
      mesMax,
      mesMin,
      ultimaVenta: ultimaVenta
        ? {
            cliente: ultimaVenta.cliente.nombre,
            monto: ultimaVenta.total,
            fecha: ultimaVenta.createdAt.toLocaleDateString("es-PE"),
          }
        : null,
      grafico: {
        labels: meses,
        data: ventasPorMes,
      },
      pedidosEstado,
    };
  } catch (error) {
    console.error("❌ Error generando resumen:", error);
    return { error: "No se pudo generar el resumen" };
  }

  // const totalAnual = ventas.reduce((a, v) => a + v.monto, 0);
  // const promedio = totalAnual / ventas.length;
  // const montos = ventas.map((v) => v.monto);
  // const max = Math.max(...montos);
  // const min = Math.min(...montos);

  // const mesMax = ventas.find((v) => v.monto === max).mes;
  // const mesMin = ventas.find((v) => v.monto === min).mes;

  // const electronica = ventas.filter((v) => v.categoria === "Electrónica");
  // const indexJulio = ventas.findIndex((v) => v.mes === "Julio");
  // const ultimaVenta = ventas.at(-1);

  // return {
  //   totalAnual: totalAnual.toLocaleString("es-PE", {
  //     style: "currency",
  //     currency: "PEN",
  //   }),
  //   promedioMensual: promedio.toFixed(2),
  //   mesMax,
  //   mesMin,
  //   indexJulio,
  //   ultimaVenta,
  //   electronicaTotal: electronica
  //     .reduce((a, v) => a + v.monto, 0)
  //     .toLocaleString("es-PE", { style: "currency", currency: "PEN" }),
  //   grafico: {
  //     labels: ventas.map((v) => v.mes),
  //     data: ventas.map((v) => v.monto),
  //   },
  // };
}

export default generarResumen;

// import Pedido from "../model/Pedido.js";

// export default async function generarResumen() {
//   try {
//     const pedidos = await Pedido.find();

//     if (pedidos.length === 0) {
//       return { message: "No hay pedidos registrados" };
//     }

//     // 🔹 Total anual
//     const totalAnual = pedidos.reduce((a, v) => a + v.monto, 0);

//     // 🔹 Agrupar por mes
//     const meses = [
//       "Enero",
//       "Febrero",
//       "Marzo",
//       "Abril",
//       "Mayo",
//       "Junio",
//       "Julio",
//       "Agosto",
//       "Setiembre",
//       "Octubre",
//       "Noviembre",
//       "Diciembre",
//     ];

//     const ventasPorMes = Array(12).fill(0);
//     pedidos.forEach((p) => {
//       const mes = new Date(p.fecha).getMonth(); // 0–11
//       ventasPorMes[mes] += p.monto;
//     });

//     // 🔹 Promedio, máximo y mínimo
//     const promedio = totalAnual / 12;
//     const max = Math.max(...ventasPorMes);
//     const min = Math.min(...ventasPorMes);
//     const mesMax = meses[ventasPorMes.indexOf(max)];
//     const mesMin = meses[ventasPorMes.indexOf(min)];

//     // 🔹 Filtrar categoría electrónica (si existe)
//     const electronicaTotal = pedidos
//       .filter((p) => p.categoria === "Electrónica")
//       .reduce((a, v) => a + v.monto, 0);

//     // 🔹 Último pedido
//     const ultimaVenta = pedidos.at(-1);

//     // 🔹 Contar pedidos por estado
//     const pedidosEstado = {
//       entregados: pedidos.filter((p) => p.estado === "Entregado").length,
//       pendientes: pedidos.filter((p) => p.estado === "Pendiente").length,
//       cancelados: pedidos.filter((p) => p.estado === "Cancelado").length,
//     };

//     return {
//       totalAnual: totalAnual.toLocaleString("es-PE", {
//         style: "currency",
//         currency: "PEN",
//       }),
//       promedioMensual: promedio.toFixed(2),
//       mesMax,
//       mesMin,
//       electronicaTotal: electronicaTotal.toLocaleString("es-PE", {
//         style: "currency",
//         currency: "PEN",
//       }),
//       ultimaVenta: ultimaVenta
//         ? {
//             cliente: ultimaVenta.cliente,
//             monto: ultimaVenta.monto,
//             categoria: ultimaVenta.categoria,
//             fecha: ultimaVenta.fecha.toLocaleDateString("es-PE"),
//           }
//         : null,
//       grafico: {
//         labels: meses,
//         data: ventasPorMes,
//       },
//       pedidosEstado,
//     };
//   } catch (error) {
//     console.error("❌ Error generando resumen:", error);
//     return { error: "No se pudo generar el resumen" };
//   }
// }
