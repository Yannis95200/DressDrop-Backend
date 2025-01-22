const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/checkout', async (req, res) => {
  try {
    const { items, totalPrice } = req.body;

    // Crée une intention de paiement avec Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice * 100, // Montant en cents
      currency: 'usd',
      payment_method_types: ['card'],
    });

    res.status(200).send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Erreur Stripe:', error.message);
    res.status(500).send({ error: 'Une erreur est survenue lors de la création de l’intention de paiement.' });
  }
});

module.exports = router;
