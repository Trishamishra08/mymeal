import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { FoodRestaurant } from '../src/modules/food/restaurant/models/restaurant.model.js';

async function check() {
    await mongoose.connect(config.mongodbUri);
    const r = await FoodRestaurant.findOne({});
    console.log(JSON.stringify(r.location, null, 2));
    process.exit(0);
}

check();
