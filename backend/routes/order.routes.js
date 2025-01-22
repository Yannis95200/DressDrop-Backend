const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller'); // Assurez-vous que ce fichier existe et que les fonctions sont exportées

router.post('/create', orderController.createOrder);
router.get('/:id', orderController.getOrder);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
