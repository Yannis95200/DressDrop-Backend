const ClothesModel = require("../models/clothes.model");
const ShopModel = require("../models/shop.model");

// Ajouter des vêtements
module.exports.addClothes = async (req, res) => {
  try {
    const { name, price, sizes, colors, shopId } = req.body;

    if (!name || !price || !sizes || !colors || !shopId) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const shop = await ShopModel.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Boutique introuvable" });
    }

    if (shop.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé. Cette boutique ne vous appartient pas." });
    }

    const newClothes = new ClothesModel({
      name,
      description: req.body.description || "",
      price,
      sizes,
      colors,
      images: req.body.images || [],
      ownerId: req.user.id,
      shopId: shopId,
    });

    const savedClothes = await newClothes.save();
    res.status(201).json(savedClothes);
  } catch (err) {
    console.error("Erreur création vêtement :", err);
    res.status(400).json({ message: "Erreur lors de l'ajout du vêtement", error: err.message });
  }
};

// Récupérer tous les vêtements
module.exports.getAllClothes = async (req, res) => {
  try {
    const clothes = await ClothesModel.find();
    res.status(200).json(clothes);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des vêtements", error: err.message });
  }
};

// Récupérer un vêtement par ID
module.exports.getClothesById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 ID reçu dans l'API :", id);

    if (!id) {
      return res.status(400).json({ message: "ID de boutique manquant" });
    }

    // Vérification si l'ID reçu correspond bien à `shopId`
    const clothes = await ClothesModel.find({ shopId: id });

    if (!clothes || clothes.length === 0) {
      return res.status(404).json({ message: "Aucun vêtement trouvé pour cette boutique" });
    }

    res.status(200).json(clothes);
  } catch (err) {
    console.error("Erreur serveur :", err.message);
    res.status(500).json({ message: "Erreur lors de la récupération des vêtements", error: err.message });
  }
};


module.exports.getClothesItemById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ID reçu dans l'API :", id);

    // Cherche un seul article avec son ID
    const item = await ClothesModel.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Article introuvable" });
    }

    res.status(200).json(item);
  } catch (err) {
    console.error("Erreur serveur :", err.message);
    res.status(500).json({ message: "Erreur lors de la récupération de l'article", error: err.message });
  }
};

// Mettre à jour un vêtement
module.exports.updateClothes = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.body;

    // Vérifiez que le vêtement existe
    const clothes = await ClothesModel.findById(id);
    if (!clothes) {
      return res.status(404).json({ message: "Vêtement introuvable" });
    }

    // Vérifiez que la boutique associée appartient à l'utilisateur
    const shop = await ShopModel.findById(clothes.shopId);
    if (shop.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé. Vous ne pouvez pas modifier ce vêtement." });
    }

    // Mettre à jour le vêtement
    const updatedClothes = await ClothesModel.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    );
    res.status(200).json(updatedClothes);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du vêtement", error: err.message });
  }
};

// Supprimer un vêtement
module.exports.deleteClothes = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifiez que le vêtement existe
    const clothes = await ClothesModel.findById(id);
    if (!clothes) {
      return res.status(404).json({ message: "Vêtement introuvable" });
    }

    // Vérifiez que la boutique associée appartient à l'utilisateur
    const shop = await ShopModel.findById(clothes.shopId);
    if (shop.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé. Vous ne pouvez pas supprimer ce vêtement." });
    }

    await ClothesModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Vêtement supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression du vêtement", error: err.message });
  }
};


