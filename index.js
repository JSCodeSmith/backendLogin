import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import routerPrincipal from "./router/routerPrincipal.js";
import db from "./db/conexion.js";

const app = express();

db(); // Conectar a la base de datos

dotenv.config();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

app.use("/api/users", routerPrincipal);

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
