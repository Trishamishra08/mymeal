import mongoose from 'mongoose';

const deliveryTimeSchema = new mongoose.Schema(
  {
    from: { type: String, trim: true, default: '' },
    to: { type: String, trim: true, default: '' },
    label: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    durationDays: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 1 },
    mealType: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Lunch + Dinner'],
      required: true,
      index: true,
    },
    dailyTiffinQuantity: { type: Number, default: 1, min: 1 },
    deliveryTime: { type: deliveryTimeSchema, default: () => ({}) },
    enableMealCustomization: { type: Boolean, default: true },
    customizationCutoffTime: { type: String, trim: true, default: '' },
    enableAddressChange: { type: Boolean, default: true },
    addressChangeCutoffTime: { type: String, trim: true, default: '' },
    enableSkipDelivery: { type: Boolean, default: true },
    skipLimit: { type: Number, default: 0, min: 0 },
    enableAddOnTiffin: { type: Boolean, default: true },
    maxAddOnQuantity: { type: Number, default: 0, min: 0 },
    deliveryType: {
      type: String,
      enum: ['Same Delivery', 'Separate Delivery'],
      default: 'Same Delivery',
    },
    benefits: { type: [String], default: [] },
    currency: { type: String, trim: true, uppercase: true, default: 'INR' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    displayOrder: { type: Number, default: 0, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    collection: 'food_subscription_plans',
    timestamps: true,
  },
);

subscriptionPlanSchema.index(
  { name: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
subscriptionPlanSchema.index({ status: 1, isDeleted: 1, displayOrder: 1 });

export const FoodSubscriptionPlan = mongoose.model('FoodSubscriptionPlan', subscriptionPlanSchema);