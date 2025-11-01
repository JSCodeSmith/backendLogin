// import Pedido from "../model/Pedido.js";

// const registrarPedido = async (req, res) => {
//   try {
//     const {
//       nombre,
//       correo,
//       telefono,
//       direccion,
//       observaciones,
//       productos = [],
//       total = 0,
//       estado = "pendiente",
//     } = req.body;

//     // 🧹 Limpiar campos string
//     const nombreLimpio = nombre?.trimStart().trimEnd() || "";
//     const correoLimpio = correo?.trimStart().trimEnd() || "";
//     const telefonoLimpio = telefono?.trimStart().trimEnd() || "";
//     const direccionLimpia = direccion?.trimStart().trimEnd() || "";
//     const observacionesLimpias = observaciones?.trimStart().trimEnd() || "";

//     // 🛡 Validaciones
//     if (!nombreLimpio || !correoLimpio || !telefonoLimpio || !direccionLimpia) {
//       return res
//         .status(400)
//         .json({ ok: false, msg: "Datos del cliente incompletos." });
//     }

//     if (!correoLimpio.includes("@")) {
//       return res.status(400).json({
//         ok: false,
//         msg: "Formato de correo inválido.",
//       });
//     }

//     if (!Array.isArray(productos) || productos.length === 0) {
//       return res
//         .status(400)
//         .json({ ok: false, msg: "Debe incluir al menos un producto." });
//     }

//     if (productos.some((p) => !p.nombre || !p.cantidad || p.cantidad <= 0)) {
//       return res.status(400).json({
//         ok: false,
//         msg: "Cada producto debe tener nombre y cantidad válida.",
//       });
//     }

//     // 📌 Verificar si ya existe un pedido pendiente del mismo cliente
//     const pedidoExistente = await Pedido.findOne({
//       "cliente.correo": correoLimpio,
//       estado: "pendiente",
//     });

//     if (pedidoExistente) {
//       return res.status(400).json({
//         ok: false,
//         msg: "Ya existe un pedido pendiente para este cliente.",
//       });
//     }

//     const totalCalculado = productos.reduce(
//       (acc, p) => acc + p.precioUnitario * p.cantidad,
//       0
//     );

//     // 🧾 Crear pedido
//     const nuevoPedido = new Pedido({
//       cliente: {
//         nombre: nombreLimpio,
//         correo: correoLimpio,
//         telefono: telefonoLimpio,
//         direccion: direccionLimpia,
//       },
//       productos,
//       observaciones: observacionesLimpias,
//       total: totalCalculado, // siempre calculado
//       estado,
//     });

//     // 💾 Guardar en base de datos
//     await nuevoPedido.save();

//     // 📤 Respuesta exitosa
//     return res.status(201).json({
//       ok: true,
//       msg: "Pedido registrado correctamente.",
//       pedido: nuevoPedido,
//     });
//   } catch (error) {
//     console.error("❌ Error en registrarPedido:", error);
//     return res.status(500).json({
//       ok: false,
//       msg: "Error del servidor al registrar el pedido.",
//     });
//   }
// };

// export default registrarPedido;

import Pedido from "../model/Pedido.js";

const registrarPedido = async (req, res) => {
  try {
    const {
      nombre,
      correo,
      telefono,
      direccion,
      observaciones,
      productos = [],
      estado = "pendiente",
    } = req.body;

    // 🧹 Limpiar campos string
    const nombreLimpio = nombre?.trim() || "";
    const correoLimpio = correo?.trim() || "";
    const telefonoLimpio = telefono?.trim() || "";
    const direccionLimpia = direccion?.trim() || "";
    const observacionesLimpias = observaciones?.trim() || "";

    // 🛡 Validaciones
    if (!nombreLimpio || !correoLimpio || !telefonoLimpio || !direccionLimpia) {
      return res
        .status(400)
        .json({ ok: false, msg: "Datos del cliente incompletos." });
    }

    if (!correoLimpio.includes("@")) {
      return res
        .status(400)
        .json({ ok: false, msg: "Formato de correo inválido." });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return res
        .status(400)
        .json({ ok: false, msg: "Debe incluir al menos un producto." });
    }

    if (
      productos.some(
        (p) => !p.nombre || !p.cantidad || p.cantidad <= 0 || !p.precioUnitario
      )
    ) {
      return res
        .status(400)
        .json({
          ok: false,
          msg: "Cada producto debe tener nombre, cantidad y precio válido.",
        });
    }

    // 📌 Verificar si ya existe un pedido pendiente
    const pedidoExistente = await Pedido.findOne({
      "cliente.correo": correoLimpio,
      estado: "pendiente",
    });

    if (pedidoExistente) {
      return res
        .status(400)
        .json({
          ok: false,
          msg: "Ya existe un pedido pendiente para este cliente.",
        });
    }

    // 🔢 Calcular subtotal por producto y total del pedido
    const productosConSubtotal = productos.map((p) => ({
      ...p,
      subtotal: p.precioUnitario * p.cantidad,
    }));

    const totalCalculado = productosConSubtotal.reduce(
      (acc, p) => acc + p.subtotal,
      0
    );

    // 🧾 Crear pedido
    const nuevoPedido = new Pedido({
      cliente: {
        nombre: nombreLimpio,
        correo: correoLimpio,
        telefono: telefonoLimpio,
        direccion: direccionLimpia,
      },
      productos: productosConSubtotal,
      observaciones: observacionesLimpias,
      total: totalCalculado,
      estado,
    });

    await nuevoPedido.save();

    return res
      .status(201)
      .json({
        ok: true,
        msg: "Pedido registrado correctamente.",
        pedido: nuevoPedido,
      });
  } catch (error) {
    console.error("❌ Error en registrarPedido:", error);
    return res
      .status(500)
      .json({ ok: false, msg: "Error del servidor al registrar el pedido." });
  }
};

export default registrarPedido;
