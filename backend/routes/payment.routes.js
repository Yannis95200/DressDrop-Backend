const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

router.post("/create-payment-intent", paymentController.createPaymentIntent);
router.post("/save-card", paymentController.saveCard);
router.post("/pay-with-card", paymentController.payWithCard);




module.exports = router;
