const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { checkRole } = require("../middleware/auth.middleware");

router.post('/create', orderController.createOrder);
router.post("/create-from-cart", orderController.createOrderFromCart);

//Mettre les routes spécifiques AVANT les routes dynamiques
router.get("/revenues", checkRole(["seller"]), orderController.getRevenueStats);
router.get("/user/:userId", orderController.getUserOrders);
router.get("/shop/:shopId", orderController.getOrdersByShop);

router.get('/:orderId', orderController.getOrder);
router.put('/:orderId', orderController.updateOrder);
router.delete('/:orderId', orderController.deleteOrder);
router.delete("/:orderId/item/:itemId", orderController.removeItemFromOrder);

module.exports = router;

