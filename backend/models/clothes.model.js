const mongoose = require("mongoose");

const clothesSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  sizes: [{ type: String, required: true }],
  colors: [{ type: String, required: true }],
  price: { type: Number, required: true },
  availability: { type: Boolean, default: true },
  images: [String],
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
}, { timestamps: true });

module.exports = mongoose.model("Clothes", clothesSchema);



