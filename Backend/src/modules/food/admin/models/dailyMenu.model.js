import mongoose from 'mongoose';

const dailyMenuItemSnapshotSchema = new mongoose.Schema(
    {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MyMealMenuItem', required: true },
        itemName: { type: String, trim: true, required: true },
        price: { type: Number, min: 0, default: 0 },
        imageUrl: { type: String, trim: true, default: '' },
        defaultQuantity: { type: String, trim: true, default: '' },
    },
    { _id: false },
);

const dailyMenuSchema = new mongoose.Schema(
    {
        menuDate: { type: String, required: true, unique: true, index: true },
        selectedItems: [
            {
                categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MyMealMenuCategory', required: true },
                itemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MyMealMenuItem' }],
            },
        ],
        defaultItems: [
            {
                categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MyMealMenuCategory', required: true },
                itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MyMealMenuItem', required: true },
            },
        ],
        snapshot: [
            {
                categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MyMealMenuCategory', required: true },
                categoryName: { type: String, trim: true, required: true },
                items: [dailyMenuItemSnapshotSchema],
                defaultItem: dailyMenuItemSnapshotSchema,
            },
        ],
        createdBy: { type: mongoose.Schema.Types.ObjectId, default: undefined },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, default: undefined },
    },
    {
        collection: 'mymeal_daily_menus',
        timestamps: true,
    },
);

dailyMenuSchema.index({ createdAt: -1 });

export const MyMealDailyMenu = mongoose.model('MyMealDailyMenu', dailyMenuSchema);
