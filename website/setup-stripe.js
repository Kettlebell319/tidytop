#!/usr/bin/env node

/**
 * TidyTop Stripe Setup Script
 * Automatically creates Stripe products and prices for drink-based pricing
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const drinks = [
  { name: 'Coffee', price: 3.47, emoji: '☕' },
  { name: 'Red Bull', price: 2.89, emoji: '🐂' },
  { name: 'Water', price: 1.25, emoji: '💧' },
  { name: 'Milk', price: 2.15, emoji: '🥛' },
  { name: 'Coca-Cola', price: 1.99, emoji: '🥤' },
  { name: 'Heineken Zero', price: 4.50, emoji: '🍺' },
  { name: 'Orange Juice', price: 2.85, emoji: '🧃' },
  { name: 'Green Tea', price: 2.10, emoji: '🍵' },
  { name: 'Whiskey', price: 8.00, emoji: '🥃' },
  { name: 'Wine', price: 7.50, emoji: '🍷' },
  { name: 'Topo Chico', price: 3.20, emoji: '🫧' },
  { name: 'Coconut Water', price: 3.75, emoji: '🥥' }
];

console.log(`
🧹 TidyTop Stripe Setup
========================

This script will help you set up Stripe products and prices for TidyTop's
drink-based pricing system.

You'll need:
1. A Stripe account (https://stripe.com)
2. Your Stripe secret key (sk_test_... or sk_live_...)

Let's get started!
`);

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupStripe() {
  try {
    // Get Stripe secret key
    const stripeKey = await askQuestion('Enter your Stripe secret key (sk_test_... or sk_live_...): ');
    
    if (!stripeKey.startsWith('sk_')) {
      console.log('❌ Invalid Stripe key. Please make sure it starts with sk_test_ or sk_live_');
      process.exit(1);
    }

    const stripe = require('stripe')(stripeKey);
    console.log('\\n✅ Stripe connection established\\n');

    // Create products and prices
    const priceIds = {};
    
    console.log('Creating Stripe products and prices...\\n');
    
    for (const drink of drinks) {
      try {
        // Create product
        console.log(`${drink.emoji} Creating ${drink.name} product...`);
        
        const product = await stripe.products.create({
          name: `TidyTop - ${drink.name}`,
          description: `Desktop organization software priced like ${drink.name.toLowerCase()}`,
          images: ['https://tidytop.app/logo.png'], // Optional: add your logo
          metadata: {
            drink_name: drink.name,
            drink_emoji: drink.emoji,
            version: '1.0.0'
          }
        });

        // Create price
        const price = await stripe.prices.create({
          product: product.id,
          currency: 'usd',
          unit_amount: Math.round(drink.price * 100), // Convert to cents
          nickname: `${drink.name.toLowerCase()}_${drink.price.toString().replace('.', '')}`,
          metadata: {
            drink_name: drink.name,
            display_price: drink.price.toString()
          }
        });

        priceIds[drink.name] = {
          productId: product.id,
          priceId: price.id,
          price: drink.price
        };

        console.log(`   ✅ Product: ${product.id}`);
        console.log(`   ✅ Price: ${price.id} ($${drink.price})\\n`);

      } catch (error) {
        console.log(`   ❌ Failed to create ${drink.name}: ${error.message}\\n`);
      }
    }

    // Generate JavaScript code for website
    console.log('\\n🎉 Setup complete! Here\\'s your JavaScript configuration:\\n');
    console.log('Copy this into your index.html file (replace the drinkData object):\\n');
    
    console.log('```javascript');
    console.log('const drinkData = {');
    
    Object.entries(priceIds).forEach(([name, data], index) => {
      const isLast = index === Object.keys(priceIds).length - 1;
      console.log(`  '${name}': { price: ${data.price}, priceId: '${data.priceId}', trend: '+1.2%' }${isLast ? '' : ','}`);
    });
    
    console.log('};');
    console.log('```\\n');

    // Save to file for reference
    const fs = require('fs');
    const configData = {
      created: new Date().toISOString(),
      stripeMode: stripeKey.startsWith('sk_test_') ? 'test' : 'live',
      products: priceIds
    };
    
    fs.writeFileSync('./stripe-config.json', JSON.stringify(configData, null, 2));
    console.log('📁 Configuration saved to stripe-config.json');

    console.log(`
🚀 Next Steps:
1. Copy the JavaScript code above into your index.html
2. Update your Stripe publishable key in index.html:
   const stripe = Stripe('${stripeKey.startsWith('sk_test_') ? 'pk_test_...' : 'pk_live_...'}');
3. Deploy your website to Vercel/Netlify
4. Set up webhook endpoint for payment confirmations
5. Test with a drink purchase!

Need help? Check DEPLOYMENT.md for detailed instructions.
    `);

  } catch (error) {
    console.log(`\\n❌ Setup failed: ${error.message}`);
    console.log('\\nMake sure your Stripe key is correct and you have internet connection.');
  }
  
  rl.close();
}

// Check if stripe is installed
try {
  require('stripe');
} catch (error) {
  console.log(`
❌ Stripe package not found. Please install it first:

npm install stripe

Then run this script again.
  `);
  process.exit(1);
}

setupStripe();