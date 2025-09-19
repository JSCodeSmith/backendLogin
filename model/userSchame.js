import mongoose from "mongoose";

const userSchame = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const userModel = mongoose.model("users", userSchame);

export default userModel;
