const mongoose = require("mongoose");

const clothesSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true }, // Référence à la boutique
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Propriétaire
  name: { type: String, required: true },
  description: { type: String, required: true },
  size: { type: String, required: true }, // Taille (e.g., S, M, L, XL)
  color: { type: String, required: true }, // Couleur
  price: { type: Number, required: true },
  availability: { type: Boolean, default: true },
  images: [String], // Galerie d'images pour l'article
  ratings: {
    average: { type: Number, default: 0 }, // Moyenne des évaluations
    count: { type: Number, default: 0 }, // Nombre d’évaluations
  },
}, { timestamps: true });

module.exports = mongoose.model("Clothes", clothesSchema);


