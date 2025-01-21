const Shop = require("../models/shop.model");
const Clothes = require("../models/clothes.model");
const geocoder = require("../utils/geocoding")

exports.createShop = async (req, res) => {
  try {
    const { name, description, locationName, image } = req.body;
    const ownerId = req.user.id;

    if (!name || !description || !locationName) {
      return res.status(400).json({ message: "Tous les champs requis doivent être remplis." });
    }

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
      location: { type: "Point", coordinates },
      image: image || "./uploads/shop/default-shop.png",
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

// Mettre à jour une boutique
exports.updateShop = async (req, res) => {
  try {
    const { id } = req.params; // ID de la boutique
    const { name, description, locationName } = req.body;

    // Vérifiez que l'utilisateur est un seller
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Accès refusé. Cette action est réservée aux vendeurs." });
    }

    // Vérifiez que l'utilisateur est le propriétaire de la boutique
    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ message: "Boutique introuvable." });
    }
    if (shop.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier cette boutique." });
    }

    // Mise à jour des données
    const updates = { name, description };
    if (locationName) {
      const geoData = await geocoder.geocode(locationName);
      if (geoData && geoData.length > 0) {
        updates.location = {
          type: "Point",
          coordinates: [geoData[0].longitude, geoData[0].latitude],
        };
      } else {
        return res.status(400).json({ message: "Nom de localisation invalide." });
      }
    }

    const updatedShop = await Shop.findByIdAndUpdate(id, updates, { new: true });
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

       // Vérifiez que l'utilisateur est un seller
       if (req.user.role !== "seller") {
        return res.status(403).json({ message: "Accès refusé. Cette action est réservée aux vendeurs." });
      }
  

    if (!deletedShop) {
      return res.status(404).json({ message: "Boutique introuvable" });
    }

    res.status(200).json({ message: "Boutique supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de la boutique", error: error.message });
  }
};
