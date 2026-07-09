import { ValidationError, NotFoundError } from '../../../../core/auth/errors.js';
import { FoodSubscriptionPlan } from '../models/subscriptionPlan.model.js';
import { FoodSubscription } from '../../subscription/models/subscription.model.js';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Lunch + Dinner'];
const DELIVERY_TYPES = ['Same Delivery', 'Separate Delivery'];

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toBool(value, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).trim().toLowerCase() === 'true';
}

function normalizeBenefits(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split('\n').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizePlanPayload(payload = {}, current = {}) {
  return {
    name: String(payload.name ?? payload.planName ?? current.name ?? '').trim(),
    description: String(payload.description ?? current.description ?? '').trim(),
    durationDays: Number(payload.durationDays ?? current.durationDays ?? 0),
    price: Number(payload.price ?? current.price ?? 0),
    mealType: String(payload.mealType ?? current.mealType ?? '').trim(),
    dailyTiffinQuantity: Number(payload.dailyTiffinQuantity ?? current.dailyTiffinQuantity ?? 1),
    deliveryTime: {
      from: String(payload.deliveryTime?.from ?? payload.deliveryFrom ?? current.deliveryTime?.from ?? '').trim(),
      to: String(payload.deliveryTime?.to ?? payload.deliveryTo ?? current.deliveryTime?.to ?? '').trim(),
      label: String(payload.deliveryTime?.label ?? current.deliveryTime?.label ?? '').trim(),
    },
    enableMealCustomization: toBool(payload.enableMealCustomization, current.enableMealCustomization ?? true),
    customizationCutoffTime: String(payload.customizationCutoffTime ?? current.customizationCutoffTime ?? '').trim(),
    enableAddressChange: toBool(payload.enableAddressChange, current.enableAddressChange ?? true),
    addressChangeCutoffTime: String(payload.addressChangeCutoffTime ?? current.addressChangeCutoffTime ?? '').trim(),
    enableSkipDelivery: toBool(payload.enableSkipDelivery, current.enableSkipDelivery ?? true),
    skipLimit: Number(payload.skipLimit ?? current.skipLimit ?? 0),
    enableAddOnTiffin: toBool(payload.enableAddOnTiffin, current.enableAddOnTiffin ?? true),
    maxAddOnQuantity: Number(payload.maxAddOnQuantity ?? current.maxAddOnQuantity ?? 0),
    deliveryType: String(payload.deliveryType ?? current.deliveryType ?? 'Same Delivery').trim(),
    benefits: normalizeBenefits(payload.benefits ?? current.benefits ?? []),
    currency: String(payload.currency ?? current.currency ?? 'INR').trim().toUpperCase() || 'INR',
    status: String(payload.status ?? current.status ?? 'active').trim().toLowerCase() === 'inactive' ? 'inactive' : 'active',
    displayOrder: Number(payload.displayOrder ?? payload.order ?? current.displayOrder ?? 0),
  };
}

function assertPlanPayload(data) {
  if (!data.name) throw new ValidationError('Plan name is required');
  if (!Number.isInteger(data.durationDays) || data.durationDays <= 0) {
    throw new ValidationError('Duration must be greater than 0 days');
  }
  if (!Number.isFinite(data.price) || data.price <= 0) {
    throw new ValidationError('Price must be greater than 0');
  }
  if (!MEAL_TYPES.includes(data.mealType)) {
    throw new ValidationError('Valid meal type is required');
  }
  if (!Number.isInteger(data.dailyTiffinQuantity) || data.dailyTiffinQuantity <= 0) {
    throw new ValidationError('Daily tiffin quantity must be at least 1');
  }
  if (!data.deliveryTime.from || !data.deliveryTime.to) {
    throw new ValidationError('Delivery time is required');
  }
  if (!DELIVERY_TYPES.includes(data.deliveryType)) {
    throw new ValidationError('Valid delivery type is required');
  }
  if (!Number.isInteger(data.skipLimit) || data.skipLimit < 0) {
    throw new ValidationError('Skip limit must be 0 or greater');
  }
  if (!Number.isInteger(data.maxAddOnQuantity) || data.maxAddOnQuantity < 0) {
    throw new ValidationError('Maximum add-on quantity must be 0 or greater');
  }
}

async function ensureUniquePlanName(name, ignoreId = null) {
  const filter = {
    name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
    isDeleted: false,
  };
  if (ignoreId) filter._id = { $ne: ignoreId };
  const existing = await FoodSubscriptionPlan.findOne(filter).select('_id').lean();
  if (existing) throw new ValidationError('A subscription plan with this name already exists');
}

export async function listSubscriptionPlans({ publicOnly = false, search = '', status = 'all' } = {}) {
  const filter = { isDeleted: false };
  if (publicOnly) {
    filter.status = 'active';
  } else if (status === 'active' || status === 'inactive') {
    filter.status = status;
  }

  const searchText = String(search || '').trim();
  if (searchText) {
    const regex = new RegExp(escapeRegex(searchText), 'i');
    filter.$or = [{ name: regex }, { description: regex }, { mealType: regex }];
  }

  return FoodSubscriptionPlan.find(filter).sort({ displayOrder: 1, createdAt: -1 }).lean();
}

export async function createSubscriptionPlan(payload = {}) {
  const data = normalizePlanPayload(payload);
  assertPlanPayload(data);
  await ensureUniquePlanName(data.name);

  if (!Number.isFinite(data.displayOrder)) {
    const last = await FoodSubscriptionPlan.findOne({ isDeleted: false }).sort({ displayOrder: -1 }).select('displayOrder').lean();
    data.displayOrder = Number(last?.displayOrder || 0) + 1;
  }

  const created = await FoodSubscriptionPlan.create({ ...data, isDeleted: false, deletedAt: null });
  return created.toObject();
}

export async function updateSubscriptionPlan(id, payload = {}) {
  const plan = await FoodSubscriptionPlan.findOne({ _id: id, isDeleted: false });
  if (!plan) return null;

  const data = normalizePlanPayload(payload, plan.toObject());
  assertPlanPayload(data);
  await ensureUniquePlanName(data.name, plan._id);

  Object.assign(plan, data);
  await plan.save();
  return plan.toObject();
}

export async function deleteSubscriptionPlan(id) {
  const plan = await FoodSubscriptionPlan.findOne({ _id: id, isDeleted: false });
  if (!plan) return { deleted: false };

  const inUse = await FoodSubscription.exists({ planId: plan._id, status: { $in: ['pending_payment', 'active', 'paused'] } });
  if (inUse) {
    throw new ValidationError('This plan is already used by subscriptions and cannot be deleted');
  }

  plan.isDeleted = true;
  plan.status = 'inactive';
  plan.deletedAt = new Date();
  await plan.save();
  return { deleted: true };
}

export async function toggleSubscriptionPlanStatus(id) {
  const plan = await FoodSubscriptionPlan.findOne({ _id: id, isDeleted: false });
  if (!plan) return null;
  plan.status = plan.status === 'active' ? 'inactive' : 'active';
  await plan.save();
  return plan.toObject();
}

export async function updateSubscriptionPlanOrder(id, displayOrder) {
  const nextOrder = Number(displayOrder);
  if (!Number.isFinite(nextOrder)) throw new ValidationError('displayOrder is required');
  return FoodSubscriptionPlan.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { displayOrder: nextOrder },
    { new: true },
  ).lean();
}

export async function getSubscriptionPlanById(id) {
  const plan = await FoodSubscriptionPlan.findOne({ _id: id, isDeleted: false }).lean();
  if (!plan) throw new NotFoundError('Subscription plan not found');
  return plan;
}