import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    name: { type: String, trim: true, default: '' },
    fullName: { type: String, trim: true, default: '' },
    street: { type: String, trim: true, default: '' },
    additionalDetails: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    zipCode: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
  },
  { _id: false },
);

const deliveryTimeSchema = new mongoose.Schema(
  {
    from: { type: String, trim: true, default: '' },
    to: { type: String, trim: true, default: '' },
    label: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const planSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    durationDays: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 1 },
    mealType: { type: String, required: true, trim: true },
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
    deliveryType: { type: String, trim: true, default: 'Same Delivery' },
    benefits: { type: [String], default: [] },
    currency: { type: String, trim: true, default: 'INR' },
  },
  { _id: false },
);

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    byRole: { type: String, required: true, trim: true },
    byId: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const foodSubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodUser', required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodSubscriptionPlan', required: true, index: true },
    planSnapshot: { type: planSnapshotSchema, required: true },
    customerName: { type: String, trim: true, default: '' },
    customerPhone: { type: String, trim: true, default: '' },
    deliveryAddress: { type: addressSchema, required: true },
    totalAmount: { type: Number, required: true, min: 1 },
    currency: { type: String, trim: true, default: 'INR' },
    status: {
      type: String,
      enum: ['pending_payment', 'active', 'paused', 'cancelled', 'expired'],
      default: 'pending_payment',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    razorpayOrderId: { type: String, trim: true, default: '', index: true },
    razorpayPaymentId: { type: String, trim: true, default: '' },
    razorpaySignature: { type: String, trim: true, default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    pausedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    pauseReason: { type: String, trim: true, default: '' },
    cancelReason: { type: String, trim: true, default: '' },
    auditLogs: { type: [auditLogSchema], default: [] },
  },
  {
    collection: 'food_subscriptions',
    timestamps: true,
  },
);

foodSubscriptionSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const FoodSubscription = mongoose.model('FoodSubscription', foodSubscriptionSchema);