import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        durationDays: {
            type: Number,
            required: true,
            min: 1
        },
        planType: {
            type: String,
            enum: ['Weekly', 'Monthly', 'Custom'],
            default: 'Weekly',
            index: true
        },
        price: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        mealType: {
            type: String,
            enum: ['Breakfast', 'Lunch', 'Dinner', 'Lunch + Dinner'],
            default: 'Lunch',
            index: true
        },
        dailyTiffinQuantity: {
            type: Number,
            default: 1,
            min: 1
        },
        deliveryTime: {
            from: { type: String, trim: true, default: '' },
            to: { type: String, trim: true, default: '' }
        },
        allowMealCustomization: {
            type: Boolean,
            default: true
        },
        customizationCutoffTime: {
            type: String,
            trim: true,
            default: ''
        },
        allowSkipDelivery: {
            type: Boolean,
            default: true
        },
        allowAddOnTiffin: {
            type: Boolean,
            default: true
        },
        subtitle: {
            type: String,
            trim: true,
            default: ''
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        badge: {
            type: String,
            trim: true,
            default: ''
        },
        currency: {
            type: String,
            trim: true,
            uppercase: true,
            default: 'INR'
        },
        features: {
            type: [String],
            default: []
        },
        sortOrder: {
            type: Number,
            default: 0,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },
        deletedAt: {
            type: Date,
            default: null
        },
    },
    {
        collection: 'food_subscription_plans',
        timestamps: true
    }
);

subscriptionPlanSchema.index({ isActive: 1, isDeleted: 1, sortOrder: 1 });
subscriptionPlanSchema.index(
    { title: 1, isDeleted: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const FoodSubscriptionPlan = mongoose.model('FoodSubscriptionPlan', subscriptionPlanSchema);
