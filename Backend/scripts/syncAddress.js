import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { FoodRestaurant } from '../src/modules/food/restaurant/models/restaurant.model.js';
import { FoodBusinessSettings } from '../src/modules/food/admin/models/businessSettings.model.js';

async function sync() {
    await mongoose.connect(config.mongodbUri);
    const settings = await FoodBusinessSettings.findOne({});
    const r = await FoodRestaurant.findOne({});
    
    if (settings && r) {
        if (!r.location) r.location = { type: 'Point', coordinates: [0,0] };
        
        r.location.address = settings.address;
        r.location.formattedAddress = settings.address;
        r.location.addressLine1 = settings.address;
        
        if (settings.location && settings.location.coordinates) {
            r.location.coordinates = settings.location.coordinates;
            r.location.longitude = settings.location.coordinates[0];
            r.location.latitude = settings.location.coordinates[1];
        }
        
        r.markModified('location');
        await r.save();
        console.log("Synced address:", settings.address);
    }
    process.exit(0);
}

sync();
