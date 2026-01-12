import jwt from "jsonwebtoken";

function verificarTokenSock(token) {
  if (!token) throw new Error("Token requerido");

  try {
    const decoded = jwt.verify(token, process.env.CLave); // 👈 asegúrate de que sea exactamente el mismo nombre de variable
    return decoded; // ejemplo: { sub: "idDelUsuario", iat, exp }
  } catch (error) {
    throw new Error("Token inválido o expirado");
  }
}
export default verificarTokenSock;
