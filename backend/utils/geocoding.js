const NodeGeocoder = require("node-geocoder");
const axios = require("axios");

const options = {
  provider: "openstreetmap",
};

const geocoder = NodeGeocoder(options);

const getCoordinatesFromAddress = async (address) => {
  try {
    const formattedAddress = `${address.street}, ${address.city}, ${address.postalCode}, ${address.country}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formattedAddress)}`;

    console.log("📡 Requête de géocodage envoyée à :", url);

    const response = await axios.get(url);

    if (response.data.length === 0) {
      console.log("❌ Adresse introuvable :", formattedAddress);
      return null;
    }

    const location = response.data[0];
    return {
      type: "Point",
      coordinates: [parseFloat(location.lon), parseFloat(location.lat)],
    };
  } catch (error) {
    console.error("❌ Erreur lors du géocodage :", error.message);
    return null;
  }
};

module.exports = {geocoder,getCoordinatesFromAddress,
};
