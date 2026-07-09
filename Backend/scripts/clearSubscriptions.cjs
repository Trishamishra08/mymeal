const mongoose = require('mongoose');
require('dotenv').config();

async function clearDb() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const collectionsToClear = [
    'food_subscriptions',
    'subscriptionmealaddintents',
    'food_subscription_schedules',
    'subscriptionplans',
    'subscriptionmealnotificationlogs',
    'usersubscriptions',
    'userplansubscriptions',
    'subscriptionplanpurchases',
    'food_subscription_plans'
  ];

  for (const col of collectionsToClear) {
    try {
      const res = await mongoose.connection.db.collection(col).deleteMany({});
      console.log(`Deleted ${res.deletedCount} documents from ${col}`);
    } catch (e) {
      console.log(`Could not clear ${col}: ${e.message}`);
    }
  }

  try {
    const res = await mongoose.connection.db.collection('food_orders').deleteMany({
      $or: [
        { orderType: 'subscription' },
        { subscriptionUsage: { $exists: true, $ne: null } }
      ]
    });
    console.log(`Deleted ${res.deletedCount} subscription orders from food_orders`);
  } catch(e) {
    console.log(`Could not clear subscription orders: ${e.message}`);
  }

  process.exit(0);
}

clearDb();
