import mongoose from 'mongoose';

const menuCategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 80 },
        nameKey: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
        imageUrl: { type: String, trim: true, default: '' },
        description: { type: String, trim: true, default: '', maxlength: 500 },
        displayOrder: { type: Number, default: 0, index: true },
        status: { type: Boolean, default: true, index: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, default: undefined },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, default: undefined },
    },
    {
        collection: 'mymeal_menu_categories',
        timestamps: true,
    },
);

menuCategorySchema.index({ status: 1, displayOrder: 1, name: 1 });

export const MyMealMenuCategory = mongoose.model('MyMealMenuCategory', menuCategorySchema);
