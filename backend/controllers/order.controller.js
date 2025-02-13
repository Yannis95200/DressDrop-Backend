const mongoose = require("mongoose");
const OrderModel = require("../models/order.model");
const UserModel = require("../models/user.model");
const ShopModel = require("../models/shop.model");
const ClothesModel = require("../models/clothes.model");



module.exports.createOrder = async (req, res) => {
  try {
    const { userId, shopId, items, totalPrice, deliveryFee = 0, tip = 0 } = req.body;

    // Vérifie que les items sont bien un tableau
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Les éléments doivent être un tableau non vide" });
    }

    // Vérifie si l'utilisateur existe
    const user = await UserModel.findById(userId);
    if (!user || !user.address) {
      return res.status(400).json({ message: "Utilisateur ou adresse d'utilisateur introuvable" });
    }

    // Vérifie si le magasin existe
    const shop = await ShopModel.findById(shopId);
    if (!shop || !shop.ShopAddress) {
      return res.status(400).json({ message: "Boutique ou adresse de boutique introuvable" });
    }

    // Calcule le montant total final
    const grandTotal = totalPrice + deliveryFee + tip;

    // Créer la commande
    const newOrder = new OrderModel({
      userId,
      shopId,
      items,
      totalPrice,
      deliveryFee,
      tip,
      grandTotal,
      status: "pending",
      deliveryAddress: user.address,
    });

    await newOrder.save();

    res.status(201).json({ message: "Commande créée avec succès", order: newOrder });
  } catch (error) {
    console.error("Erreur lors de la création de la commande:", error);
    res.status(500).json({ message: "Erreur lors de la création de la commande", error });
  }
};


// Récupérer une commande par ID
module.exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Numéro de commande invalide" });
    }

    const order = await OrderModel.findById(orderId).populate("shopId userId");

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Erreur lors de la récupération de la commande:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de la commande", error });
  }
};


// Mettre à jour les commandes
module.exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, updates, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Numéro de commande invalide" });
    }

    res.status(200).json({ message: "Commande mise à jour avec succès", order: updatedOrder });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la commande:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la commande", error });
  }
};


module.exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Numéro de commande invalide" });
    }

    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Numéro de commande invalide" });
    }

    res.status(200).json({ message: "Commande supprimée avec succès", order: deletedOrder });
  } catch (error) {
    console.error("Erreur lors de la suppression de la commande:", error);
    res.status(500).json({ message: "Erreur lors de la suppression de la commande", error });
  }
};