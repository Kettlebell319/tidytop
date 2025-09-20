export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const envVars = {
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    hasStripeKeyTest: !!process.env.STRIPE_SECRET_KEY_TEST,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('STRIPE'))
  };

  res.status(200).json(envVars);
}