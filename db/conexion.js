import mongoose from "mongoose";

const db = () => {
  mongoose
    .connect(
      "mongodb+srv://Josue:Josue%401r34@cluster0.yh0qunl.mongodb.net/mydb?retryWrites=true&w=majority"
    )
    .then(() => {
      console.log("Conectado a la base de datos");
    })
    .catch((error) => {
      console.error("Error al conectar a la base de datos:", error);
    });
};

export default db;
