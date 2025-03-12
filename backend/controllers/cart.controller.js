const CartModel = require("../models/cart.model");
const ClothesModel = require("../models/clothes.model");

module.exports.addToCart = async (req, res) => {
  try {
    const { userId, items } = req.body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "ID utilisateur et articles requis" });
    }

    let cart = await CartModel.findOne({ userId });

    if (!cart) {
      cart = new CartModel({ userId, items });
    } else {
      items.forEach((item) => {
        const existingItem = cart.items.find((i) => i.productId.toString() === item.productId);
        existingItem ? (existingItem.quantity += item.quantity) : cart.items.push(item);
      });
    }

    await updateTotalPrice(cart);

    // Peupler les informations du produit avant de renvoyer la réponse
    const populatedCart = await CartModel.populate(cart, {
      path: "items.productId",
      select: "name price images",
      model: "Clothes",
    });

    res.status(200).json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
// Supprimer un article du panier
module.exports.removeFromCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { productId } = req.body; // ✅ Récupère `productId` depuis le body

    if (!cartId || !productId) {
      return res.status(400).json({ message: "⚠️ ID du panier et du produit requis" });
    }

    let cart = await CartModel.findById(cartId);
    if (!cart) {
      return res.status(404).json({ message: "⚠️ Panier introuvable" });
    }

    // Supprimer uniquement l'élément spécifique
    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);

    // Mise à jour du total du panier
    const productIds = cart.items.map((item) => item.productId);
    const clothes = await ClothesModel.find({ _id: { $in: productIds } });

    cart.totalPrice = cart.items.reduce((total, item) => {
      const product = clothes.find((p) => p._id.toString() === item.productId.toString());
      return total + (product ? product.price * item.quantity : 0);
    }, 0);

    await cart.save();

    res.status(200).json({ message: "Produit supprimé avec succès", updatedCart: cart });
  } catch (error) {
    console.error("Erreur suppression article :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// Récupérer le contenu du panier
module.exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "ID utilisateur requis" });
    }

    // Récupérer le panier avec les détails du produit
    const cart = await CartModel.findOne({ userId }).populate({
      path: "items.productId",
      select: "name price images",
      model: "Clothes",
    });

    if (!cart) {
      return res.status(404).json({ message: "Panier introuvable" });
    }

    // Log pour vérifier la structure des données
    console.log("✅ Cart avec détails produits :", JSON.stringify(cart, null, 2));

    res.status(200).json(cart);
  } catch (error) {
    console.error("Erreur serveur lors de la récupération du panier :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};




// Vider complètement le panier
module.exports.clearCart = async (req, res) => {
    try {
      const { cartId } = req.params;
  
      if (!cartId) {
        return res.status(400).json({ message: "ID du panier requis" });
      }
  
      let cart = await CartModel.findById(cartId);
  
      if (!cart) {
        return res.status(404).json({ message: "Panier introuvable" });
      }
  
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save();
  
      res.status(200).json({ message: "Panier vidé avec succès", cart });
    } catch (error) {
      console.error("Erreur lors du vidage du panier :", error);
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };

// Fonction utilitaire pour mettre à jour le prix total du panier
const updateTotalPrice = async (cart) => {
  const productIds = cart.items.map((item) => item.productId);
  const clothes = await ClothesModel.find({ _id: { $in: productIds } });

  cart.totalPrice = cart.items.reduce((total, item) => {
    const product = clothes.find((p) => p._id.toString() === item.productId.toString());
    return total + (product ? product.price * item.quantity : 0);
  }, 0);

  await cart.save();
};
