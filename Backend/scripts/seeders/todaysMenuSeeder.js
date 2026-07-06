import { MyMealMenuCategory } from '../../src/modules/food/admin/models/menuCategory.model.js';
import { MyMealMenuItem } from '../../src/modules/food/admin/models/menuItem.model.js';
import { MyMealDailyMenu } from '../../src/modules/food/admin/models/dailyMenu.model.js';
import { logger } from '../../src/utils/logger.js';

const todaysAvailableItems = {
    veg: ['paneerbuttermasala', 'mixveg', 'cholemasala'],
    rice: ['plainrice', 'jeerarice'],
    roti: ['4roti', '6roti'],
    dal: ['dalfry', 'daltadka'],
    salad: ['greensalad'],
    dessert: ['gulabjamun'],
    beverage: ['buttermilk']
};

const defaultMealItems = {
    veg: 'paneerbuttermasala',
    rice: 'plainrice',
    roti: '4roti',
    dal: 'dalfry',
    salad: 'greensalad',
    dessert: 'gulabjamun',
    beverage: 'buttermilk'
};

export async function seedTodaysMenu() {
    try {
        const todayDate = new Date().toISOString().split('T')[0];

        const exists = await MyMealDailyMenu.findOne({ menuDate: todayDate });
        if (exists) {
            logger.info(`Today's menu already exists for date ${todayDate}, skipping...`);
            console.log(`Today's menu already exists for date ${todayDate}, skipping...`);
            return;
        }

        const categories = await MyMealMenuCategory.find({ status: true });
        
        const selectedItems = [];
        const defaultItems = [];
        const snapshot = [];

        for (const cat of categories) {
            const catKey = cat.nameKey;
            
            if (!todaysAvailableItems[catKey]) continue;

            const itemsInCat = await MyMealMenuItem.find({
                categoryId: cat._id,
                nameKey: { $in: todaysAvailableItems[catKey] }
            });

            if (itemsInCat.length === 0) continue;

            selectedItems.push({
                categoryId: cat._id,
                itemIds: itemsInCat.map(i => i._id)
            });

            const defaultItemKey = defaultMealItems[catKey];
            const defaultItem = itemsInCat.find(i => i.nameKey === defaultItemKey);

            if (defaultItem) {
                defaultItems.push({
                    categoryId: cat._id,
                    itemId: defaultItem._id
                });
            }

            snapshot.push({
                categoryId: cat._id,
                categoryName: cat.name,
                items: itemsInCat.map(i => ({
                    itemId: i._id,
                    itemName: i.name,
                    price: i.price,
                    imageUrl: i.imageUrl,
                    defaultQuantity: i.defaultQuantity
                })),
                defaultItem: defaultItem ? {
                    itemId: defaultItem._id,
                    itemName: defaultItem.name,
                    price: defaultItem.price,
                    imageUrl: defaultItem.imageUrl,
                    defaultQuantity: defaultItem.defaultQuantity
                } : undefined
            });
        }

        await MyMealDailyMenu.create({
            menuDate: todayDate,
            selectedItems,
            defaultItems,
            snapshot
        });

        logger.info(`✅ Today's Menu Seeded for ${todayDate}`);
        console.log(`✅ Today's Menu Seeded`);
        console.log(`✅ Default Meal Configured`);
    } catch (error) {
        logger.error('Error seeding todays menu:', error);
        throw error;
    }
}
