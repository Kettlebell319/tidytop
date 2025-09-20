// Vercel serverless function for handling Stripe webhooks
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Log successful payment for analytics
        console.log('Payment successful:', {
          sessionId: session.id,
          customerEmail: session.customer_details?.email,
          amount: session.amount_total,
          currency: session.currency,
          drinkName: session.metadata?.drink_name,
          macArchitecture: session.metadata?.mac_architecture,
          timestamp: new Date().toISOString()
        });

        // TODO: Store in database for analytics
        // await storePaymentAnalytics(session);
        
        // TODO: Send confirmation email if needed
        // await sendConfirmationEmail(session.customer_details.email, session.metadata);

        break;

      case 'checkout.session.expired':
        console.log('Checkout session expired:', event.data.object.id);
        break;

      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

// Configure to receive raw body for signature verification
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};