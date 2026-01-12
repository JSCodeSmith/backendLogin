// models/reviewSchema.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    optimisticConcurrency: false, // Desactivar control optimista de concurrencia
    versionKey: false, // No usar __v para control de versión
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices para mejor rendimiento
reviewSchema.index({ product: 1, date: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
