const express = require("express");
const router = express.Router();
const cartController = require('../controllers/cart.controller');

// Ajoutez un article au panier
router.post('/add', cartController.addToCart);

// Supprimez un article du panier
router.delete('/remove/:itemId', cartController.removeFromCart);

// Obtenez le contenu du panier
router.get('/', cartController.getCart);

module.exports = router;
