const mongoose = require("mongoose");

const DeliveryOptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    estimatedTime: { type: String, required: true },
  });
  
  module.exports = mongoose.model('DeliveryOption', DeliveryOptionSchema);
  