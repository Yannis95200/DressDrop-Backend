const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Montant invalide" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convertir en centimes
      currency: "eur",
      payment_method_types: ["card"],
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Erreur Stripe:", error);
    res.status(500).json({ message: "Erreur serveur Stripe", error: error.message });
  }
};

module.exports.saveCard = async (req, res) => {
        try {
            const { cardNumber, expMonth, expYear, cvc } = req.body;
    
            if (!cardNumber || !expMonth || !expYear || !cvc) {
                return res.status(400).json({ message: "Informations de carte incomplètes" });
            }
    
            // Création du payment method
            const paymentMethod = await stripe.paymentMethods.create({
                type: "card",
                card: {
                    number: cardNumber,
                    exp_month: expMonth,
                    exp_year: expYear,
                    cvc: cvc,
                },
            });
    
            res.json({ paymentMethodId: paymentMethod.id });
        } catch (error) {
            console.error("Erreur Stripe:", error);
            res.status(500).json({ message: "Erreur serveur Stripe", error: error.message });
        }
    };

module.exports.payWithCard = async (req, res) => {
    try {
        const { amount, paymentMethodId } = req.body;

        if (!amount || !paymentMethodId) {
            return res.status(400).json({ message: "Montant et paymentMethodId requis" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: "eur",
            payment_method: paymentMethodId,
            confirm: true,
        });

        res.status(200).json({ message: "Paiement réussi", paymentIntent });
    } catch (error) {
        console.error("Erreur Stripe:", error);
        res.status(500).json({ message: "Erreur lors du paiement", error: error.message });
    }
};