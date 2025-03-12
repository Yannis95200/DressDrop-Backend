const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

router.post('/create', orderController.createOrder);
router.post("/create-from-cart", orderController.createOrderFromCart);
router.get('/:orderId', orderController.getOrder);
router.put('/:orderId', orderController.updateOrder);
router.delete('/:orderId', orderController.deleteOrder);
router.delete("/:orderId/item/:itemId", orderController.removeItemFromOrder);
router.get("/user/:userId", orderController.getUserOrders);


module.exports = router;
