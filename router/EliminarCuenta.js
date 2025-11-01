import jwt from "jsonwebtoken";
import User from "../model/userSchame.js";

const EliminarCuenta = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ msg: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.CLave);

    console.log(decoded);

    const user = await User.findByIdAndDelete(decoded.id);
    console.log(user);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.json({ msg: "Cuenta eliminada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al eliminar cuenta" });
  }
};

export default EliminarCuenta;
