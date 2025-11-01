import Mensaje from "../model/MensajeSchema.js";

// Soft delete (más seguro)
async function eliminarMensaje(id, editorId) {
  try {
    const actualizado = await Mensaje.findOneAndUpdate(
      // o await Mensaje.findOneAndDelete({ id });
      { id },
      {
        $set: {
          eliminado: true,
          estado: "eliminado",
          texto: "(Mensaje eliminado)",
          editadoPor: editorId,
        },
      },
      { new: true } // devuelve el mensaje actualizado
    );

    if (!actualizado) throw new Error("Mensaje no encontrado");
    return actualizado;
  } catch (err) {
    console.error("Error al eliminar:", err.message);
    throw err;
  }
}
export default eliminarMensaje;
