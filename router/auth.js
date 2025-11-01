import jwt from "jsonwebtoken";

const verificarToken = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.CLave);
    req.usuario = decoded; // Guarda datos del usuario en la request

    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};
// replace(), replaceAll()
export default verificarToken;
