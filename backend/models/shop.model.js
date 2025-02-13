const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  ShopAddress: {
    street: String,
    city: String,
    postalCode: String,
    country: String,
  },
  image: { type: String, default: "./uploads/shop/default-shop.png" },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  location: { 
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: { type: [Number], required: true }
  }
}, { timestamps: true });

// Index géospatial pour rechercher des boutiques proches
shopSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Shop", shopSchema);
