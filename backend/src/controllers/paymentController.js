'use strict';
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');

exports.createIntent = async (req, res) => {
  try {
    const { amount, currency = 'eur', orderId } = req.body;
    
    // amount is in EUROS (e.g. 8.80), convert to cents
    const amountCents = Math.round(parseFloat(amount) * 100);
    
    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ error: `Invalid amount: ${amount} EUR (${amountCents} cents, min 50 cents)` });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const intent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency,
      metadata: { orderId: String(orderId || '') },
      automatic_payment_methods: { enabled: true },
    });

    console.log(`✅ Payment intent created: ${intent.id} for €${amount} (${amountCents} cents)`);
    res.json({ clientSecret: intent.client_secret });
  } catch(e) {
    console.error('Stripe error:', e.message);
    res.status(500).json({ error: e.message });
  }
};

exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(
      req.body, sig,
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
