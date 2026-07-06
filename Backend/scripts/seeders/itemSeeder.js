import { MyMealMenuCategory } from '../../src/modules/food/admin/models/menuCategory.model.js';
import { MyMealMenuItem } from '../../src/modules/food/admin/models/menuItem.model.js';
import { logger } from '../../src/utils/logger.js';

const itemsData = [
    { categoryKey: 'veg', items: [
        { name: 'Paneer Butter Masala', price: 120, prep: 20, cal: 350 },
        { name: 'Mix Veg', price: 90, prep: 15, cal: 200 },
        { name: 'Aloo Matar', price: 80, prep: 15, cal: 180 },
        { name: 'Chole Masala', price: 90, prep: 20, cal: 220 },
        { name: 'Rajma Masala', price: 90, prep: 20, cal: 250 },
        { name: 'Shahi Paneer', price: 130, prep: 25, cal: 400 },
        { name: 'Bhindi Masala', price: 80, prep: 15, cal: 150 },
        { name: 'Aloo Gobi', price: 80, prep: 15, cal: 160 },
        { name: 'Soyabean Curry', price: 80, prep: 15, cal: 190 },
        { name: 'Kadai Paneer', price: 140, prep: 20, cal: 380 },
    ]},
    { categoryKey: 'rice', items: [
        { name: 'Plain Rice', price: 30, prep: 10, cal: 130 },
        { name: 'Jeera Rice', price: 45, prep: 12, cal: 150 },
        { name: 'Veg Pulao', price: 60, prep: 15, cal: 200 },
        { name: 'Peas Pulao', price: 60, prep: 15, cal: 190 },
        { name: 'Fried Rice', price: 80, prep: 15, cal: 250 },
    ]},
    { categoryKey: 'roti', items: [
        { name: '2 Roti', price: 15, prep: 5, cal: 140 },
        { name: '4 Roti', price: 30, prep: 8, cal: 280 },
        { name: '6 Roti', price: 45, prep: 10, cal: 420 },
        { name: 'Butter Roti', price: 20, prep: 5, cal: 100 },
        { name: 'Tandoori Roti', price: 25, prep: 8, cal: 110 },
    ]},
    { categoryKey: 'dal', items: [
        { name: 'Dal Fry', price: 60, prep: 15, cal: 180 },
        { name: 'Dal Tadka', price: 70, prep: 15, cal: 200 },
        { name: 'Dal Makhani', price: 100, prep: 20, cal: 300 },
        { name: 'Yellow Dal', price: 50, prep: 15, cal: 160 },
        { name: 'Panchmel Dal', price: 80, prep: 15, cal: 220 },
    ]},
    { categoryKey: 'salad', items: [
        { name: 'Green Salad', price: 30, prep: 5, cal: 50 },
        { name: 'Onion Salad', price: 20, prep: 5, cal: 30 },
        { name: 'Cucumber Salad', price: 25, prep: 5, cal: 20 },
        { name: 'Mixed Salad', price: 40, prep: 10, cal: 60 },
    ]},
    { categoryKey: 'dessert', items: [
        { name: 'Gulab Jamun', price: 30, prep: 5, cal: 300 },
        { name: 'Rasgulla', price: 30, prep: 5, cal: 250 },
        { name: 'Kheer', price: 50, prep: 10, cal: 350 },
        { name: 'Ice Cream', price: 60, prep: 5, cal: 200 },
    ]},
    { categoryKey: 'beverage', items: [
        { name: 'Buttermilk', price: 20, prep: 5, cal: 80 },
        { name: 'Lassi', price: 40, prep: 5, cal: 150 },
        { name: 'Mineral Water', price: 20, prep: 0, cal: 0 },
        { name: 'Cold Drink', price: 40, prep: 0, cal: 150 },
    ]},
];

const getImageForCategory = (key) => {
    switch (key) {
        case 'veg': return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80';
        case 'rice': return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80';
        case 'roti': return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80';
        case 'dal': return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80';
        case 'salad': return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80';
        case 'dessert': return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80';
        case 'beverage': return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80';
        default: return '';
    }
};

export async function seedItems() {
    let insertedCount = 0;
    try {
        const categoriesMap = {};
        const categories = await MyMealMenuCategory.find();
        for (const cat of categories) {
            categoriesMap[cat.nameKey] = cat._id;
        }

        for (const group of itemsData) {
            const categoryId = categoriesMap[group.categoryKey];
            if (!categoryId) {
                logger.warn(`Category ${group.categoryKey} not found, skipping items...`);
                continue;
            }

            for (const itemData of group.items) {
                const nameKey = itemData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const exists = await MyMealMenuItem.findOne({ nameKey, categoryId });
                if (!exists) {
                    await MyMealMenuItem.create({
                        name: itemData.name,
                        nameKey,
                        categoryId,
                        price: itemData.price,
                        preparationTime: itemData.prep,
                        calories: itemData.cal,
                        description: `Delicious ${itemData.name}`,
                        imageUrl: getImageForCategory(group.categoryKey),
                        status: true,
                        availability: true,
                        defaultQuantity: '1 portion'
                    });
                    insertedCount++;
                }
            }
        }
        logger.info(`✅ Items Seeded: Inserted ${insertedCount} new items`);
        console.log(`✅ Items Seeded`);
    } catch (error) {
        logger.error('Error seeding items:', error);
        throw error;
    }
}
