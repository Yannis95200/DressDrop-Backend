const CartModel = require('../models/cart.model');
const ClothesModel = require('../models/clothes.model');

// Ajout d'un article
module.exports.addToCart = async (req, res) => {
    try {
        const { userId, items } = req.body;

        // Vérifiez si les champs requis sont présents
        if (!userId || !items || items.length === 0 || !items[0].productId) {
            return res.status(400).json({ message: 'userId and items with productId are required' });
        }

        // Recherchez un panier existant pour l'utilisateur
        let cart = await CartModel.findOne({ userId });

        if (!cart) {
            // Créez un nouveau panier si aucun n'existe
            cart = new CartModel({ userId, items });
        } else {
            // Mettez à jour le panier existant
            items.forEach((item) => {
                const existingItem = cart.items.find((i) => i.productId.toString() === item.productId);
                if (existingItem) {
                    existingItem.quantity += item.quantity;
                } else {
                    cart.items.push(item);
                }
            });
        }

        // Récupérez les détails des vêtements pour calculer le prix total
        const productIds = cart.items.map((item) => item.productId);
        const clothes = await ClothesModel.find({ _id: { $in: productIds } });

        // Calculez le prix total
        let totalPrice = 0;
        cart.items.forEach((item) => {
            const product = clothes.find((p) => p._id.toString() === item.productId.toString());
            if (product) {
                totalPrice += product.price * item.quantity;
            }
        });

        cart.totalPrice = totalPrice;

        // Enregistrez le panier
        const updatedCart = await cart.save();
        res.status(200).json(updatedCart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding to cart', error });
    }
};

// fonction pour enlever une quantité spécifique d'un produit
module.exports.removeFromCart = async (req, res) => {
    try {
        const { userId, productId, quantityToRemove } = req.body;

        // Vérifiez si les champs nécessaires sont présents
        if (!userId || !productId || !quantityToRemove) {
            return res.status(400).json({ message: 'userId, productId, and quantityToRemove are required' });
        }

        // Trouvez le panier de l'utilisateur
        let cart = await CartModel.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Trouvez l'élément dans le panier
        const existingItem = cart.items.find((item) => item.productId.toString() === productId);

        if (!existingItem) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        // Si la quantité à enlever est plus grande que la quantité existante, supprimez l'élément
        if (existingItem.quantity <= quantityToRemove) {
            cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
        } else {
            existingItem.quantity -= quantityToRemove;
        }

        // Récupérez les détails des produits pour recalculer le prix total
        const productIds = cart.items.map((item) => item.productId);
        const clothes = await ClothesModel.find({ _id: { $in: productIds } });

        // Calculez le prix total
        let totalPrice = 0;
        cart.items.forEach((item) => {
            const product = clothes.find((p) => p._id.toString() === item.productId.toString());
            if (product) {
                totalPrice += product.price * item.quantity;
            }
        });

        cart.totalPrice = totalPrice;

        // Sauvegardez les changements dans le panier
        const updatedCart = await cart.save();

        // Répondre avec un message de succès
        res.status(200).json({ message: 'Product removed successfully', updatedCart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error removing from cart', error });
    }
};



module.exports.getCart = async (req, res) => {
    try {
        const { userId } = req.params;
        // Vérifiez si l'ID utilisateur est présent
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        // Recherchez le panier de l'utilisateur
        const cart = await CartModel.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Récupérez les détails des produits dans le panier
        const productIds = cart.items.map((item) => item.productId);
        const clothes = await ClothesModel.find({ _id: { $in: productIds } });

        // Calculez le prix total du panier
        let totalPrice = 0;
        cart.items.forEach((item) => {
            const product = clothes.find((p) => p._id.toString() === item.productId.toString());
            if (product) {
                totalPrice += product.price * item.quantity;
            }
        });

        cart.totalPrice = totalPrice;

        // Renvoi du panier avec le prix total calculé
        res.status(200).json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching cart', error });
    }
};
