'use strict';
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Create payment intent
exports.createIntent = async (req, res) => {
  try {
    const { amount, currency = 'eur', orderId } = req.body;
    if (!amount || amount < 50) return res.status(400).json({ error: 'Invalid amount' });

    const intent = await stripe.paymentIntents.create({
      amount:   Math.round(amount * 100), // cents
      currency,
      metadata: { orderId: String(orderId || '') },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: intent.client_secret });
  } catch(e) {
    console.error('Stripe error:', e.message);
    res.status(500).json({ error: e.message });
  }
};

// Webhook for payment confirmation
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
    if (event.type === 'payment_intent.succeeded') {
      console.log('✅ Payment confirmed:', event.data.object.id);
    }
    res.json({ received: true });
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
};
