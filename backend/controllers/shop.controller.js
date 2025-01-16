const Shop = require("../models/shop.model");
const Clothes = require("../models/clothes.model");
const geocoder = require("../utils/geocoding")

// Créer une boutique
exports.createShop = async (req, res) => {
  try {
    const { name, description, locationName, image } = req.body;
    const ownerId = req.user.id;

    // Géocodage du nom de la ville pour obtenir les coordonnées
    const geoData = await geocoder.geocode(locationName);
    if (!geoData.length) {
      return res.status(400).json({ message: "Ville introuvable pour le géocodage." });
    }

    // Extraction des coordonnées [longitude, latitude]
    const coordinates = [geoData[0].longitude, geoData[0].latitude];

    const shop = new Shop({
      ownerId,
      name,
      description,
      location: { coordinates },
      image,
    });

    await shop.save();
    res.status(201).json({ message: "Boutique créée avec succès", shop });
  } catch (error) {
    console.error("Erreur lors de la création de la boutique :", error);
    res.status(500).json({ message: "Erreur lors de la création de la boutique", error: error.message });
  }
};

// Obtenir toutes les boutiques
exports.getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find();
    res.status(200).json(shops);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des boutiques", error: error.message });
  }
};

// Rechercher des boutiques proches
exports.getNearbyShops = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude et longitude sont requises" });
    }

    const nearbyShops = await Shop.find({
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radius / 6378.1], // Radius en radians (6378.1 km = rayon de la Terre)
        },
      },
    });

    res.status(200).json(nearbyShops);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la recherche des boutiques proches", error: error.message });
  }
};

// Mettre à jour une boutique
exports.updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedShop = await Shop.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedShop) {
      return res.status(404).json({ message: "Boutique introuvable" });
    }

    res.status(200).json({ message: "Boutique mise à jour avec succès", shop: updatedShop });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour de la boutique", error: error.message });
  }
};

// Récupérer les vêtements d'une boutique
exports.getClothesByShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    const clothes = await Clothes.find({ shopId });

    if (!clothes || clothes.length === 0) {
      return res.status(404).json({ message: "Aucun vêtement trouvé pour cette boutique" });
    }

    res.status(200).json(clothes);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des vêtements", error: error.message });
  }
};

// Supprimer une boutique
exports.deleteShop = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedShop = await Shop.findByIdAndDelete(id);

    if (!deletedShop) {
      return res.status(404).json({ message: "Boutique introuvable" });
    }

    res.status(200).json({ message: "Boutique supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de la boutique", error: error.message });
  }
};
