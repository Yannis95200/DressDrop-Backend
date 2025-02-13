const mongoose = require("mongoose");

const DeliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },

  deliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },

  shopAddress: { street: { type: String, required: true },city: { type: String, required: true },coordinates: {type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: { type: [Number], required: true },
    },
  },
userAddress: { street: { type: String, required: true },city: { type: String, required: true },
    coordinates: {type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
    },
  },
estimatedDeliveryTime: {
    distanceInKm: { type: Number, required: true },
    timeInMinutes: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'delivered', 'failed'],
    default: 'pending',
  },

  liveTracking: {liveCoordinates: {type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    lastUpdated: { type: Date, default: Date.now },
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Delivery", DeliverySchema);

