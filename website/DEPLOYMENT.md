# TidyTop Landing Page Deployment Guide

## Quick Setup (5 minutes to launch)

### 1. Stripe Setup
1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard:
   - **Publishable Key**: `pk_test_...` (for testing) or `pk_live_...` (for production)
   - **Secret Key**: `sk_test_...` (for testing) or `sk_live_...` (for production)

3. **Update the publishable key** in `index.html` line 514:
   ```javascript
   const stripe = Stripe('pk_test_YOUR_ACTUAL_KEY_HERE');
   ```

4. **Create Stripe Products** (one-time setup):
   - Go to Stripe Dashboard > Products
   - Create products for each drink with these exact names:
     - Coffee ($3.47)
     - Red Bull ($2.89)
     - Water ($1.25)
     - Milk ($2.15)
     - Coca-Cola ($1.99)
     - Heineken Zero ($4.50)
     - Orange Juice ($2.85)
     - Green Tea ($2.10)
     - Whiskey ($8.00)
     - Wine ($7.50)
     - Topo Chico ($3.20)
     - Coconut Water ($3.75)

5. **Copy the Price IDs** and update them in `index.html` lines 517-530

### 2. Deploy to Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy from this directory**:
   ```bash
   cd website
   npm install
   vercel --prod
   ```

3. **Set environment variables** in Vercel dashboard:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Create a webhook endpoint and copy the secret

4. **Setup Stripe Webhook**:
   - Go to Stripe Dashboard > Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy webhook secret to Vercel environment variables

### 3. Custom Domain Setup
1. In Vercel dashboard, go to your project settings
2. Add custom domain: `tidytop.app`
3. Configure DNS records as instructed by Vercel

## Alternative: GitHub Pages (Static Only)
If you want to start with just the frontend (no payment processing):

1. **Copy files to repository root**:
   ```bash
   cp website/index.html ./
   cp website/success.html ./
   cp website/cancel.html ./
   ```

2. **Enable GitHub Pages** in repository settings

3. **Note**: Payment processing won't work without serverless functions

## Testing the Payment Flow

### Test Mode Setup
1. Use Stripe test keys (`pk_test_...` and `sk_test_...`)
2. Use test card number: `4242 4242 4242 4242`
3. Any future expiry date and any 3-digit CVC

### Production Mode Setup
1. Replace with live keys (`pk_live_...` and `sk_live_...`)
2. Test with real payment methods
3. Enable Stripe webhook in live mode

## Analytics & Monitoring

### Stripe Dashboard
- Monitor payments and failed transactions
- View customer data and download analytics
- Track conversion rates by drink type

### Vercel Analytics (Optional)
- Add Vercel analytics to track page views
- Monitor API function performance
- Track user geography and device types

## Troubleshooting

### Common Issues
1. **"Stripe key not found"**: Update publishable key in `index.html`
2. **"Price not found"**: Update Stripe price IDs in drink data object
3. **Webhook failures**: Check webhook secret in environment variables
4. **Download links broken**: Verify GitHub release URLs are correct

### Debug Mode
Add `?debug=true` to URL to see console logs for Mac detection and price loading.

## Next Steps (Phase 2)

Once basic payments are working:
1. **Dynamic Pricing**: Implement price fetching API
2. **Database**: Add Supabase for price caching and analytics
3. **Reddit Integration**: Add desktop chaos meter
4. **Advanced Analytics**: Detailed conversion tracking

## Support
- GitHub Issues: https://github.com/kettlebell319/tidytop/issues
- Stripe Documentation: https://stripe.com/docs
- Vercel Documentation: https://vercel.com/docs