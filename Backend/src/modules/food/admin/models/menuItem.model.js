import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        nameKey: { type: String, required: true, trim: true, lowercase: true, index: true },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MyMealMenuCategory',
            required: true,
            index: true,
        },
        imageUrl: { type: String, trim: true, default: '' },
        price: { type: Number, min: 0, default: 0 },
        description: { type: String, trim: true, default: '', maxlength: 1000 },
        preparationTime: { type: Number, min: 0, default: 0 },
        calories: { type: Number, min: 0, default: 0 },
        defaultQuantity: { type: String, trim: true, default: '1 portion', maxlength: 80 },
        availability: { type: Boolean, default: true, index: true },
        status: { type: Boolean, default: true, index: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, default: undefined },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, default: undefined },
    },
    {
        collection: 'mymeal_menu_items',
        timestamps: true,
    },
);

menuItemSchema.index({ nameKey: 1, categoryId: 1 }, { unique: true });
menuItemSchema.index({ status: 1, availability: 1, categoryId: 1, name: 1 });

export const MyMealMenuItem = mongoose.model('MyMealMenuItem', menuItemSchema);
