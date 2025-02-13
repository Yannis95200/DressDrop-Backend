const Shop = require("../models/shop.model");
const User = require("../models/user.model");
const Clothes = require("../models/clothes.model");
const geocoder = require("../utils/geocoding");

// Créer une boutique
exports.createShop = async (req, res) => {
  try {
    const { name, description, ShopAddress, image } = req.body;
    const ownerId = req.user.id;

    if (!name || !description || !ShopAddress) {
      return res.status(400).json({ message: "Tous les champs requis doivent être remplis." });
    }

    // Géocodage de l'adresse de la boutique pour obtenir les coordonnées
    const geoData = await geocoder.geocode(`${ShopAddress.street}, ${ShopAddress.city}, ${ShopAddress.country}`);
    if (!geoData.length) {
      return res.status(400).json({ message: "Adresse introuvable pour le géocodage." });
    }

    // Extraction des coordonnées [longitude, latitude]
    const coordinates = [geoData[0].longitude, geoData[0].latitude];

    const shop = new Shop({
      ownerId,
      name,
      description,
      location: { type: "Point", coordinates },
      ShopAddress,
      image: image || "./uploads/shop/default-shop.png",
    });

    await shop.save();
    res.status(201).json({ message: "Boutique créée avec succès", shop });
  } catch (error) {
    console.error("Erreur lors de la création de la boutique :", error);
    res.status(500).json({ message: "Erreur lors de la création de la boutique", error: error.message });
  }
};

// Mettre à jour une boutique
exports.updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, ShopAddress } = req.body;

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
    const updates = { name, description, ShopAddress };
    
    if (ShopAddress) {
      // Géocodage de l'adresse de la boutique pour obtenir les coordonnées
      const geoData = await geocoder.geocode(`${ShopAddress.street}, ${ShopAddress.city}, ${ShopAddress.country}`);
      if (geoData && geoData.length > 0) {
        updates.location = {
          type: "Point",
          coordinates: [geoData[0].longitude, geoData[0].latitude],
        };
      } else {
        // Mise à jour du message d'erreur pour l'adresse de la boutique
        return res.status(400).json({ message: "Adresse de la boutique invalide." });
      }
    }

    // Mise à jour de la boutique dans la base de données
    const updatedShop = await Shop.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json({ message: "Boutique mise à jour avec succès", shop: updatedShop });
  } catch (error) {
    // Gérer l'erreur si une exception se produit
    res.status(500).json({ message: "Erreur lors de la mise à jour de la boutique", error: error.message });
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

    // Trouver la boutique pour vérifier le propriétaire
    const shop = await Shop.findById(id);

    if (!shop) {
      return res.status(404).json({ message: "Boutique introuvable" });
    }

    // Vérifiez que l'utilisateur est un vendeur et qu'il est le créateur de la boutique
    if (shop.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé à supprimer cette boutique." });
    }

    // Supprimer la boutique
    await shop.deleteOne();

    res.status(200).json({ message: "Boutique supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de la boutique", error: error.message });
  }
};

module.exports.getNearbyShopsForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier si l'utilisateur existe et a une localisation
    const user = await User.findById(userId);
    if (!user || !user.location || !user.location.coordinates) {
      return res.status(404).json({ message: "Utilisateur non trouvé ou localisation manquante." });
    }

    const [longitude, latitude] = user.location.coordinates;

    // Rechercher les boutiques proches avec une distance de 20 km
    const shops = await Shop.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: 20000
        }
      }
    });

    res.status(200).json({
      message: shops.length ? "Boutiques proches trouvées." : "Aucune boutique à proximité.",
      shops
    });
  } catch (error) {
    console.error("Erreur lors de la recherche des boutiques proches:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};