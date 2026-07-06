import { MyMealMenuCategory } from '../../src/modules/food/admin/models/menuCategory.model.js';
import { logger } from '../../src/utils/logger.js';

const categories = [
    { name: 'Veg', nameKey: 'veg', displayOrder: 1, status: true, description: 'Fresh vegetarian meals', imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80' },
    { name: 'Rice', nameKey: 'rice', displayOrder: 2, status: true, description: 'Aromatic rice dishes', imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80' },
    { name: 'Roti', nameKey: 'roti', displayOrder: 3, status: true, description: 'Freshly baked Indian breads', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80' },
    { name: 'Dal', nameKey: 'dal', displayOrder: 4, status: true, description: 'Comforting lentil soups', imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80' },
    { name: 'Salad', nameKey: 'salad', displayOrder: 5, status: true, description: 'Healthy fresh salads', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80' },
    { name: 'Dessert', nameKey: 'dessert', displayOrder: 6, status: true, description: 'Sweet treats', imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80' },
    { name: 'Beverage', nameKey: 'beverage', displayOrder: 7, status: true, description: 'Refreshing drinks', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80' },
];

export async function seedCategories() {
    let insertedCount = 0;
    try {
        for (const cat of categories) {
            const exists = await MyMealMenuCategory.findOne({ nameKey: cat.nameKey });
            if (!exists) {
                await MyMealMenuCategory.create(cat);
                insertedCount++;
            }
        }
        logger.info(`✅ Categories Seeded: Inserted ${insertedCount} new categories`);
        console.log(`✅ Categories Seeded`);
    } catch (error) {
        logger.error('Error seeding categories:', error);
        throw error;
    }
}
