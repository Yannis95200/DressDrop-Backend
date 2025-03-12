const express = require("express");
const router = express.Router();
const cartController = require('../controllers/cart.controller');

router.post('/add', cartController.addToCart);
router.delete('/remove/:cartId', cartController.removeFromCart);
router.delete("/clear/:cartId", cartController.clearCart);
router.get('/:userId', cartController.getCart);

module.exports = router;
