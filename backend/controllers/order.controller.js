const mongoose = require("mongoose");
const OrderModel = require("../models/order.model");
const UserModel = require("../models/user.model");
const ShopModel = require("../models/shop.model");
const ClothesModel = require("../models/clothes.model");
const CartModel = require("../models/cart.model");


const haversine = (coords1, coords2) => {
  if (!coords1 || !coords2 || coords1.length < 2 || coords2.length < 2) {
    console.error("Erreur: Coordonnées invalides", { coords1, coords2 });
    throw new Error("Coordonnées invalides pour le calcul de la distance.");
  }

  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const lat1 = coords1[1];
  const lon1 = coords1[0];
  const lat2 = coords2[1];
  const lon2 = coords2[0];

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const estimateDeliveryTime = (distance) => {
  const averageSpeedKmPerHour = 30;
  const timeInHours = distance / averageSpeedKmPerHour;
  const timeInMinutes = Math.round(timeInHours * 60);

  return timeInMinutes < 10 ? 10 : timeInMinutes;
};

// Création d'une commande à partir du panier
module.exports.createOrderFromCart = async (req, res) => {
  try {
    const { userId, cartId, deliveryFee = 0, tip = 0 } = req.body;

    if (!userId || !cartId) {
      return res.status(400).json({ message: "ID utilisateur et ID panier requis." });
    }

    // Vérification et récupération du panier
    const cart = await CartModel.findById(cartId).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Panier vide ou introuvable." });
    }

    // Récupération de l'utilisateur et vérification de l'adresse
    const user = await UserModel.findById(userId);
    if (!user || !user.location || !user.location.coordinates) {
      console.error("Erreur: Adresse utilisateur invalide", user);
      return res.status(400).json({
        message: "Adresse utilisateur invalide. Veuillez définir votre adresse avec des coordonnées GPS.",
        userAddress: user.address || null,
        userLocation: user.location || null
      });
    }

    // Récupération du magasin depuis le premier produit
    const shopId = cart.items[0].productId.shopId;
    const shop = await ShopModel.findById(shopId);
    if (!shop || !shop.location || !shop.location.coordinates) {
      console.error("Erreur: Adresse boutique invalide", shop);
      return res.status(400).json({
        message: "Adresse de la boutique invalide. Veuillez vérifier les informations du magasin.",
        shopLocation: shop.location || null
      });
    }

    // Vérification des coordonnées avant le calcul de distance
    const userCoordinates = user.location.coordinates;
    const shopCoordinates = shop.location.coordinates;

    if (!userCoordinates || userCoordinates.length < 2 || !shopCoordinates || shopCoordinates.length < 2) {
      console.error("Erreur: Coordonnées invalides", { userCoordinates, shopCoordinates });
      return res.status(400).json({
        message: "Coordonnées invalides pour le calcul de la distance.",
        userCoordinates,
        shopCoordinates
      });
    }

    // Calcul de la distance et du temps estimé de livraison
    const distance = haversine(shopCoordinates, userCoordinates);
    const estimatedTime = estimateDeliveryTime(distance);

    console.log(`Distance : ${distance.toFixed(2)} km`);
    console.log(`Temps estimé : ${estimatedTime} min`);

    // Création de la commande
    const newOrder = new OrderModel({
      userId,
      shopId,
      items: cart.items.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
      })),
      totalPrice: cart.totalPrice,
      deliveryFee,
      tip,
      grandTotal: cart.totalPrice + deliveryFee + tip,
      status: "pending",
      deliveryAddress: user.address,
      estimatedTime,
    });

    await newOrder.save();

    // Suppression du panier après la commande
    await CartModel.findByIdAndDelete(cartId);

    res.status(201).json({
      message: "Commande créée avec succès",
      order: newOrder,
      estimatedTime,
    });
  } catch (error) {
    console.error("Erreur lors de la commande :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// Création de la commande avec estimation du temps de livraison
module.exports.createOrder = async (req, res) => {
  try {
    const { userId, shopId, items, totalPrice, deliveryFee = 0, tip = 0 } = req.body;

    if (!userId || !shopId || !items || items.length === 0) {
      return res.status(400).json({ message: "Données de commande incomplètes." });
    }

    const user = await UserModel.findById(userId);
    if (!user || !user.location || !Array.isArray(user.location.coordinates) || user.location.coordinates.length < 2) {
      console.error("Erreur: Adresse utilisateur introuvable ou incorrecte:", user);
      return res.status(400).json({ message: "Adresse de l'utilisateur invalide" });
    }

    const shop = await ShopModel.findById(shopId);
    if (!shop || !shop.location || !Array.isArray(shop.location.coordinates) || shop.location.coordinates.length < 2) {
      console.error("Erreur: Adresse de la boutique introuvable ou incorrecte:", shop);
      return res.status(400).json({ message: "Adresse de la boutique invalide" });
    }

    // Extraire les coordonnées correctes
    const userCoordinates = user.location.coordinates;
    const shopCoordinates = shop.location.coordinates;

    console.log("Adresse du magasin:", shopCoordinates);
    console.log("Adresse de l'utilisateur:", userCoordinates);

    // Calcul de la distance et du temps estimé
    const distance = haversine(shopCoordinates, userCoordinates);
    const estimatedTime = estimateDeliveryTime(distance);

    console.log(`Distance calculée : ${distance.toFixed(2)} km`);
    console.log(`Temps de livraison estimé : ${estimatedTime} min`);

    // Création de la commande
    const newOrder = new OrderModel({
      userId,
      shopId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice,
      deliveryFee,
      tip,
      grandTotal: totalPrice + deliveryFee + tip,
      status: "pending",
      deliveryAddress: user.address,
      estimatedTime,
    });

    await newOrder.save();
    res.status(201).json({message: "Commande créée avec succès",order: newOrder,estimatedTime: estimatedTime});
  } catch (error) {
    console.error("Erreur lors de la commande :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};




// Récupérer une commande par ID
module.exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Numéro de commande invalide" });
    }

    const order = await OrderModel.findById(orderId)
      .populate("shopId userId")
      .populate({
        path: "items.productId",
        model: "Clothes",
      });

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

// Supprimer un article spécifique d'une commande
module.exports.removeItemFromOrder = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "ID de commande ou d'article invalide" });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    order.items = order.items.filter((item) => item._id.toString() !== itemId);

    // Recalculer le prix total
    order.totalPrice = order.items.reduce((total, item) => total + item.price * item.quantity, 0);
    order.grandTotal = order.totalPrice + order.deliveryFee + order.tip;

    await order.save();

    res.status(200).json({ message: "Article supprimé avec succès", order });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article :", error);
    res.status(500).json({ message: "Erreur lors de la suppression de l'article", error });
  }
};

module.exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("📡 Requête reçue pour userId :", typeof userId, userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    const orders = await OrderModel.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate({
        path: "shopId",
        select: "name location image",
      })
      .populate({
        path: "items.productId",
        select: "name price images",
        model: "Clothes",
      })
      .sort({ createdAt: -1 });

    console.log("📦 Commandes trouvées :", JSON.stringify(orders, null, 2));

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Aucune commande trouvée pour cet utilisateur." });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Obtenir les commandes par boutique
module.exports.getOrdersByShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ message: "ID de boutique invalide" });
    }

    const orders = await OrderModel.find({ shopId })
      .populate({
        path: "userId",
        select: "pseudo email address",
      })
      .populate({
        path: "items.productId",
        select: "name price images",
        model: "Clothes",
      })
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Aucune commande trouvée pour cette boutique." });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes de la boutique :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
// Récupérer le chiffre d'affaires par boutique
exports.getRevenueStats = async (req, res) => {
  try {
    const { shopId } = req.query;

    if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ message: "ID de boutique invalide" });
    }

    // 🧮 On récupère toutes les commandes de cette boutique (sans filtrer par statut)
    const orders = await OrderModel.find({ shopId }).select("totalPrice createdAt");

    const revenuePerMonth = {};

    orders.forEach((order) => {
      const month = new Date(order.createdAt).toISOString().slice(0, 7); // ex: "2025-04"
      if (!revenuePerMonth[month]) {
        revenuePerMonth[month] = 0;
      }
      revenuePerMonth[month] += order.totalPrice;
    });

    // On retourne un tableau exploitable par le front
    const result = Object.entries(revenuePerMonth).map(([month, totalRevenue]) => ({
      month,
      totalRevenue,
    }));

    res.status(200).json({ revenuePerMonth: result });
  } catch (error) {
    console.error("Erreur récupération chiffre d'affaires :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};