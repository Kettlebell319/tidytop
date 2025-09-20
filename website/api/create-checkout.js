// Vercel serverless function for creating Stripe checkout sessions
// Updated for live payments
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Enable CORS for frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, macArchitecture, drinkName } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }


    // Get the domain for redirect URLs
    const domain = req.headers.origin || 'https://tidytop.app';
    
    // Determine download URL based on Mac architecture
    const downloadUrl = macArchitecture === 'apple-silicon' 
      ? 'https://github.com/Kettlebell319/tidytop/releases/download/v1.0.0/TidyTop-1.0.0-arm64.dmg'
      : 'https://github.com/Kettlebell319/tidytop/releases/download/v1.0.0/TidyTop-1.0.0.dmg';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${domain}/success.html?download=${encodeURIComponent(downloadUrl)}&drink=${encodeURIComponent(drinkName)}`,
      cancel_url: `${domain}/cancel.html`,
      client_reference_id: macArchitecture,
      metadata: {
        drink_name: drinkName,
        mac_architecture: macArchitecture,
        download_url: downloadUrl,
      },
      // Optional: Collect customer email for updates
      customer_creation: 'always',
      // Optional: Add custom branding
      custom_text: {
        submit: {
          message: 'Your desktop organization journey starts here!'
        }
      }
    });

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe checkout creation failed:', error);
    
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message,
      code: error.code,
      type: error.type
    });
  }
}