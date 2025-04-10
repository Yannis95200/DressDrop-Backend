const Shop = require("../models/shop.model");
const User = require("../models/user.model");
const Clothes = require("../models/clothes.model");
const { geocoder } = require("../utils/geocoding");


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

    // Vérifiez que l'utilisateur est un "seller"
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Accès refusé. Seuls les vendeurs peuvent modifier une boutique." });
    }

    // Vérifiez que la boutique existe
    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ message: "Boutique introuvable." });
    }

    // Vérifiez que l'utilisateur est bien le propriétaire de la boutique
    if (shop.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier cette boutique." });
    }

    // Préparation des mises à jour
    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (ShopAddress) {
      // Géocodage de la nouvelle adresse
      const locationData = await getCoordinatesFromAddress(ShopAddress);
      if (locationData) {
        updates.ShopAddress = ShopAddress;
        updates.location = locationData;
      } else {
        return res.status(400).json({ message: "Adresse invalide. Impossible d'obtenir des coordonnées." });
      }
    }

    // Mise à jour dans la base de données
    const updatedShop = await Shop.findByIdAndUpdate(id, updates, { new: true });

    return res.status(200).json({ message: "Boutique mise à jour avec succès", shop: updatedShop });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la boutique :", error);
    return res.status(500).json({ message: "Erreur lors de la mise à jour de la boutique", error: error.message });
  }
};


// Obtenir toutes les boutiques
exports.getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find();
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Modifier chaque shop pour inclure l'URL complète de l'image
    const shopsWithFullImage = shops.map(shop => ({
      ...shop._doc,
      image: shop.image.startsWith("/uploads") ? `${baseUrl}${shop.image}` : shop.image
    }));

    res.status(200).json(shopsWithFullImage);
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
    const user = await User.findById(userId);
    if (!user || !user.location || !user.location.coordinates) {
      return res.status(404).json({ message: "Utilisateur non trouvé ou localisation manquante." });
    }

    const [longitude, latitude] = user.location.coordinates;

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


exports.getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await Shop.findById(id);

    if (!shop) {
      return res.status(404).json({ message: "Boutique introuvable." });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const shopWithFullImage = {
      ...shop._doc,
      image: shop.image.startsWith("/uploads") ? `${baseUrl}${shop.image}` : shop.image
    };

    res.status(200).json(shopWithFullImage);
  } catch (error) {
    console.error("Erreur lors de la récupération de la boutique:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};