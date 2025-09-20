const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_REPLACE_WITH_YOUR_KEY');

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

async function createProducts() {
  console.log('🧹 Creating TidyTop Stripe products...\n');
  
  const priceData = {};
  
  for (const drink of drinks) {
    try {
      console.log(`${drink.emoji} Creating ${drink.name}...`);
      
      // Create product
      const product = await stripe.products.create({
        name: `TidyTop - ${drink.name}`,
        description: `Desktop organization software priced like ${drink.name.toLowerCase()}`,
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
        unit_amount: Math.round(drink.price * 100),
        nickname: `${drink.name.toLowerCase()}_${drink.price.toString().replace('.', '')}`,
        metadata: {
          drink_name: drink.name,
          display_price: drink.price.toString()
        }
      });

      priceData[drink.name] = {
        productId: product.id,
        priceId: price.id,
        price: drink.price
      };

      console.log(`   ✅ Price ID: ${price.id}`);
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\n🎉 JavaScript configuration for your website:\n');
  console.log('const drinkData = {');
  
  Object.entries(priceData).forEach(([name, data], index) => {
    const isLast = index === Object.keys(priceData).length - 1;
    console.log(`  '${name}': { price: ${data.price}, priceId: '${data.priceId}', trend: '+1.2%' }${isLast ? '' : ','}`);
  });
  
  console.log('};');
  
  // Save to file
  const fs = require('fs');
  const configData = {
    created: new Date().toISOString(),
    stripeMode: 'live',
    products: priceData
  };
  
  fs.writeFileSync('./stripe-config.json', JSON.stringify(configData, null, 2));
  console.log('\n📁 Configuration saved to stripe-config.json');
}

createProducts().catch(console.error);