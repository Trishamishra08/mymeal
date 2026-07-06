import mongoose from 'mongoose';
import { FoodOrder } from './src/modules/food/orders/models/order.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const orders = await FoodOrder.find({ orderType: { $ne: 'one_time_tiffin' } }).sort({ createdAt: -1 }).limit(3).lean();
  for (const o of orders) {
    console.log(`Order ${o._id} (regular): Total=${o.pricing?.total}, Discount=${o.pricing?.discount}, couponDiscount=${o.pricing?.couponDiscount}, couponCode=${o.pricing?.couponCode}`);
  }
  process.exit(0);
}
check();
