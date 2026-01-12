// fix-index.js
import mongoose from "mongoose";
import Mensaje from "./model/MensajeSchema.js"; // ruta correcta a tu modelo
import db from "./db/conexion.js";

async function run() {
  db();
  console.log("Conectado");

  // Mostrar índices
  const indexes = await Mensaje.collection.indexes();
  console.log("Indexes before:", indexes);

  // Intentar borrar index id_1 (si existe)
  try {
    await Mensaje.collection.dropIndex("id_1");
    console.log("Índice id_1 eliminado");
  } catch (err) {
    console.log("dropIndex error (posible que no exista):", err.message);
  }

  // Opcional: limpiar campo id
  // await Mensaje.updateMany({}, { $unset: { id: "" } });

  const indexesAfter = await Mensaje.collection.indexes();
  console.log("Indexes after:", indexesAfter);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
