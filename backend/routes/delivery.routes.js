const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');

router.get('/options', deliveryController.getDeliveryOptions);
router.post('/schedule', deliveryController.scheduleDelivery);

module.exports = router;
