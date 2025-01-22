const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

router.post('/create', orderController.createOrder);
router.get('/:orderId', orderController.getOrder);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
