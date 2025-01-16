const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Le vendeur propriétaire
  name: { type: String, required: true, unique: true }, // Nom unique de la boutique
  description: { type: String, required: true }, // Description de la boutique
  location: { 
    type: { type: String, default: "Point" }, 
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  image: { type: String, default: "./uploads/shop/default-shop.png" }, // Image de la boutique
  ratings: {
    average: { type: Number, default: 0 }, // Moyenne des évaluations
    count: { type: Number, default: 0 } // Nombre d’évaluations
  },
}, { timestamps: true });

// Index géospatial pour rechercher des boutiques proches
shopSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Shop", shopSchema);
