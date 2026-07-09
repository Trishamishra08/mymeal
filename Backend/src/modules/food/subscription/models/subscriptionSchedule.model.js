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

const addOnItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'paid' },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const foodSubscriptionScheduleSchema = new mongoose.Schema(
  {
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodSubscription', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodUser', required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodSubscriptionPlan', required: true, index: true },
    serviceDate: { type: Date, required: true, index: true },
    mealType: { type: String, required: true, trim: true },
    deliveryAddress: { type: addressSchema, required: true },
    mealSelections: { type: Map, of: String, default: {} },
    isCustomized: { type: Boolean, default: false },
    customizedAt: { type: Date, default: null },
    isAddressChanged: { type: Boolean, default: false },
    addressChangedAt: { type: Date, default: null },
    isSkipped: { type: Boolean, default: false },
    skippedAt: { type: Date, default: null },
    skipReason: { type: String, trim: true, default: '' },
    addOnItems: { type: [addOnItemSchema], default: [] },
    assignedDeliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodDeliveryPartner', default: null, index: true },
    assignedAt: { type: Date, default: null },
    fulfillmentStatus: {
      type: String,
      enum: ['pending', 'ready_for_assignment', 'assigned', 'accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled', 'skipped'],
      default: 'pending',
      index: true,
    },
    deliveredAt: { type: Date, default: null },
    auditLogs: { type: [auditLogSchema], default: [] },
  },
  {
    collection: 'food_subscription_schedules',
    timestamps: true,
  },
);

foodSubscriptionScheduleSchema.index({ subscriptionId: 1, serviceDate: 1 }, { unique: true });
foodSubscriptionScheduleSchema.index({ serviceDate: 1, fulfillmentStatus: 1 });

export const FoodSubscriptionSchedule = mongoose.model('FoodSubscriptionSchedule', foodSubscriptionScheduleSchema);