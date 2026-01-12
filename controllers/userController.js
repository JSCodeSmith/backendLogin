import Usuario from "../model/Usuario.js";

async function getUsuario(req, res) {
  try {
    const { id } = req.params;

    const user = await Usuario.findById(id).select("-password");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuario" });
  }
}

async function setAvatar(req, res) {
  try {
    const { id } = req.params;
    const { image } = req.body;

    const updatedUser = await Usuario.findByIdAndUpdate(
      id,
      { avatar: image },
      { new: true }
    );

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar avatar" });
  }
}

async function logOut(req, res) {
  try {
    const { id } = req.params;
    global.onlineUsers?.delete(id);
    res.json({ mensaje: "Sesión cerrada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al cerrar sesión" });
  }
}

export { setAvatar, logOut, getUsuario };
