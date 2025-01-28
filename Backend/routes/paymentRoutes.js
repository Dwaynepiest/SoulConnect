const express = require('express');
const Stripe = require('stripe');
const apiKeyMiddleware = require('../middlewares/apiKeyMiddleware');
const router = express.Router();

const stripe = Stripe(process.env.STRIPE); // Vervang met je Secret Key

// Endpoint voor het aanmaken van een PaymentIntent
router.post('/', apiKeyMiddleware, async (req, res) => {
  try {
    const { amount, currency } = req.body; // Bedrag in centen
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card', 'ideal', 'bancontact'], // Voeg hier methoden toe
    });
    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


module.exports = router;
