export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Simple test - just get account info
    const account = await stripe.account.retrieve();
    
    res.status(200).json({ 
      success: true,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      type: error.type,
      code: error.code
    });
  }
}