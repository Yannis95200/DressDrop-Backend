const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');

router.post('/schedule', deliveryController.scheduleDelivery);
router.get("/available", deliveryController.getAvailableDeliveries);
router.put('/:id/accept', deliveryController.acceptDelivery)
router.put("/:id/complete", deliveryController.completeDelivery);
router.put("/:orderId/tracking", deliveryController.updateLiveTracking);

module.exports = router;