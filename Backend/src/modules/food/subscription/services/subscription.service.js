import mongoose from 'mongoose';
import { ValidationError, NotFoundError } from '../../../../core/auth/errors.js';
import { FoodSubscriptionPlan } from '../../landing/models/subscriptionPlan.model.js';
import { FoodSubscription } from '../models/subscription.model.js';
import { FoodSubscriptionSchedule } from '../models/subscriptionSchedule.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodUser } from '../../../../core/users/user.model.js';
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  isRazorpayConfigured,
  verifyPaymentSignature,
} from '../../orders/helpers/razorpay.helper.js';
import {
  assertSubscriptionFlowAllowed,
  getAppCustomizationSettings,
} from '../../shared/appCustomization.service.js';

function buildAddress(address = {}, { customerName = '', customerPhone = '' } = {}) {
  return {
    label: String(address.label || 'Home').trim() || 'Home',
    name: String(address.name || customerName || '').trim(),
    fullName: String(address.fullName || address.name || customerName || '').trim(),
    street: String(address.street || '').trim(),
    additionalDetails: String(address.additionalDetails || '').trim(),
    city: String(address.city || '').trim(),
    state: String(address.state || '').trim(),
    zipCode: String(address.zipCode || '').trim(),
    phone: String(address.phone || customerPhone || '').trim(),
    location: Array.isArray(address?.location?.coordinates)
      ? { type: 'Point', coordinates: address.location.coordinates }
      : undefined,
  };
}

function addAuditLog(doc, action, byRole, byId, note = '') {
  if (!Array.isArray(doc.auditLogs)) doc.auditLogs = [];
  doc.auditLogs.push({
    action,
    byRole,
    byId: byId ? String(byId) : '',
    note: String(note || '').trim(),
    createdAt: new Date(),
  });
}

function normalizePlan(plan) {
  return {
    id: plan._id?.toString?.() || String(plan._id || ''),
    name: plan.name,
    description: plan.description || '',
    durationDays: Number(plan.durationDays || 0),
    price: Number(plan.price || 0),
    mealType: plan.mealType || '',
    dailyTiffinQuantity: Number(plan.dailyTiffinQuantity || 1),
    deliveryTime: plan.deliveryTime || { from: '', to: '', label: '' },
    enableMealCustomization: plan.enableMealCustomization !== false,
    customizationCutoffTime: plan.customizationCutoffTime || '',
    enableAddressChange: plan.enableAddressChange !== false,
    addressChangeCutoffTime: plan.addressChangeCutoffTime || '',
    enableSkipDelivery: plan.enableSkipDelivery !== false,
    skipLimit: Number(plan.skipLimit || 0),
    enableAddOnTiffin: plan.enableAddOnTiffin !== false,
    maxAddOnQuantity: Number(plan.maxAddOnQuantity || 0),
    deliveryType: plan.deliveryType || 'Same Delivery',
    benefits: Array.isArray(plan.benefits) ? plan.benefits : [],
    currency: plan.currency || 'INR',
    status: plan.status || 'inactive',
    displayOrder: Number(plan.displayOrder || 0),
  };
}

function normalizeSubscription(subscription, schedules = []) {
  const plan = subscription.planSnapshot || {};
  const startDate = subscription.startDate ? new Date(subscription.startDate) : null;
  const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let remainingDays = 0;
  if (endDate && startDate && endDate >= today) {
    remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86400000) + 1);
  }

  return {
    id: subscription._id?.toString?.() || String(subscription._id || ''),
    subscriptionId: subscription._id?.toString?.() || String(subscription._id || ''),
    userId: subscription.userId?._id?.toString?.() || subscription.userId?.toString?.() || '',
    planId: subscription.planId?._id?.toString?.() || subscription.planId?.toString?.() || '',
    planName: plan.name || '',
    planDescription: plan.description || '',
    durationDays: Number(plan.durationDays || 0),
    totalAmount: Number(subscription.totalAmount || 0),
    currency: subscription.currency || 'INR',
    mealType: plan.mealType || '',
    dailyTiffinQuantity: Number(plan.dailyTiffinQuantity || 1),
    deliveryTime: plan.deliveryTime || { from: '', to: '', label: '' },
    benefits: Array.isArray(plan.benefits) ? plan.benefits : [],
    customerName: subscription.customerName || '',
    customerPhone: subscription.customerPhone || '',
    deliveryAddress: subscription.deliveryAddress || null,
    status: subscription.status || '',
    paymentStatus: subscription.paymentStatus || '',
    startDate: subscription.startDate || null,
    endDate: subscription.endDate || null,
    remainingDays: subscription.remainingMeals !== undefined ? subscription.remainingMeals : remainingDays,
    schedules,
    createdAt: subscription.createdAt || null,
  };
}

function parseCutoffDate(serviceDate, timeText) {
  const clean = String(timeText || '').trim();
  if (!clean) return null;
  const match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  const cutoff = new Date(serviceDate);
  cutoff.setHours(hours, minutes, 0, 0);
  return cutoff;
}

function ensureEditableBeforeCutoff(serviceDate, cutoffTime, message) {
  const cutoff = parseCutoffDate(serviceDate, cutoffTime);
  if (!cutoff) return;
  if (new Date() > cutoff) {
    throw new ValidationError(message);
  }
}

function buildScheduleRows(subscription) {
  const rows = [];
  const start = new Date(subscription.startDate);
  start.setHours(0, 0, 0, 0);
  const totalDays = Number(subscription.planSnapshot?.durationDays || 0);
  for (let index = 0; index < totalDays; index += 1) {
    const serviceDate = new Date(start);
    serviceDate.setDate(start.getDate() + index);
    rows.push({
      subscriptionId: subscription._id,
      userId: subscription.userId,
      planId: subscription.planId,
      serviceDate,
      mealType: subscription.planSnapshot?.mealType || '',
      deliveryAddress: subscription.deliveryAddress,
      mealSelections: {},
      fulfillmentStatus: 'pending',
      auditLogs: [
        {
          action: 'schedule_created',
          byRole: 'SYSTEM',
          byId: '',
          note: 'Schedule created during subscription activation',
          createdAt: new Date(),
        },
      ],
    });
  }
  return rows;
}

async function findUserSubscription(userId, subscriptionId) {
  const subscription = await FoodSubscription.findOne({
    _id: subscriptionId,
    userId: new mongoose.Types.ObjectId(userId),
  });
  if (!subscription) throw new NotFoundError('Subscription not found');
  return subscription;
}

async function findUserSchedule(userId, scheduleId) {
  const schedule = await FoodSubscriptionSchedule.findOne({
    _id: scheduleId,
    userId: new mongoose.Types.ObjectId(userId),
  });
  if (!schedule) throw new NotFoundError('Subscription day not found');
  return schedule;
}

export async function createSubscriptionOrder(userId, dto) {
  const settings = await getAppCustomizationSettings();
  assertSubscriptionFlowAllowed(settings);

  const plan = await FoodSubscriptionPlan.findOne({
    _id: dto.planId,
    isDeleted: false,
    status: 'active',
  }).lean();
  if (!plan) throw new ValidationError('Subscription plan not found');

  const normalizedPlan = normalizePlan(plan);
  const deliveryAddress = buildAddress(dto.deliveryAddress, {
    customerName: dto.customerName,
    customerPhone: dto.customerPhone,
  });
  if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state) {
    throw new ValidationError('Delivery address is required');
  }

  const amount = Math.round(Number(normalizedPlan.price || 0) * 100);
  if (!isRazorpayConfigured() && settings.directPaymentTestMode !== true) {
    throw new ValidationError('Razorpay is not configured');
  }

  const razorpayOrder = settings.directPaymentTestMode === true
    ? { id: `sub_test_${Date.now()}`, amount, currency: normalizedPlan.currency || 'INR' }
    : await createRazorpayOrder(amount, normalizedPlan.currency || 'INR', `sub_${Date.now()}`);

  const subscription = await FoodSubscription.create({
    userId: new mongoose.Types.ObjectId(userId),
    planId: new mongoose.Types.ObjectId(normalizedPlan.id),
    planSnapshot: {
      name: normalizedPlan.name,
      description: normalizedPlan.description,
      durationDays: normalizedPlan.durationDays,
      price: normalizedPlan.price,
      mealType: normalizedPlan.mealType,
      dailyTiffinQuantity: normalizedPlan.dailyTiffinQuantity,
      deliveryTime: normalizedPlan.deliveryTime,
      enableMealCustomization: normalizedPlan.enableMealCustomization,
      customizationCutoffTime: normalizedPlan.customizationCutoffTime,
      enableAddressChange: normalizedPlan.enableAddressChange,
      addressChangeCutoffTime: normalizedPlan.addressChangeCutoffTime,
      enableSkipDelivery: normalizedPlan.enableSkipDelivery,
      skipLimit: normalizedPlan.skipLimit,
      enableAddOnTiffin: normalizedPlan.enableAddOnTiffin,
      maxAddOnQuantity: normalizedPlan.maxAddOnQuantity,
      deliveryType: normalizedPlan.deliveryType,
      benefits: normalizedPlan.benefits,
      currency: normalizedPlan.currency,
    },
    customerName: String(dto.customerName || '').trim(),
    customerPhone: String(dto.customerPhone || '').trim(),
    deliveryAddress,
    totalAmount: normalizedPlan.price,
    currency: normalizedPlan.currency,
    razorpayOrderId: razorpayOrder.id,
    status: 'pending_payment',
    paymentStatus: 'created',
    auditLogs: [],
  });

  addAuditLog(subscription, 'subscription_checkout_created', 'USER', userId, 'Subscription checkout created');
  await subscription.save();

  return {
    subscription: normalizeSubscription(subscription.toObject()),
    order: razorpayOrder,
    razorpay: {
      key: getRazorpayKeyId(),
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    },
  };
}

export async function verifySubscriptionPayment(userId, dto) {
  const subscription = await findUserSubscription(userId, dto.subscriptionId);
  if (subscription.status === 'active' && subscription.paymentStatus === 'paid') {
    return { subscription: normalizeSubscription(subscription.toObject()) };
  }
  if (String(subscription.razorpayOrderId) !== String(dto.razorpayOrderId)) {
    throw new ValidationError('Razorpay order mismatch');
  }

  const settings = await getAppCustomizationSettings();
  const valid = settings.directPaymentTestMode === true
    ? true
    : verifyPaymentSignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
  if (!valid) {
    subscription.paymentStatus = 'failed';
    addAuditLog(subscription, 'subscription_payment_failed', 'SYSTEM', '', 'Payment verification failed');
    await subscription.save();
    throw new ValidationError('Payment verification failed');
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  if (settings.subscriptionOrders?.startFrom === 'tomorrow') {
    startDate.setDate(startDate.getDate() + 1);
  }
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + Number(subscription.planSnapshot?.durationDays || 0) - 1);
  endDate.setHours(23, 59, 59, 999);

  subscription.razorpayPaymentId = dto.razorpayPaymentId;
  subscription.razorpaySignature = dto.razorpaySignature;
  subscription.paymentStatus = 'paid';
  subscription.status = 'active';
  subscription.startDate = startDate;
  subscription.endDate = endDate;
  addAuditLog(subscription, 'subscription_activated', 'SYSTEM', '', 'Subscription activated after payment verification');
  await subscription.save();

  const rows = buildScheduleRows(subscription.toObject());
  if (rows.length) {
    await FoodSubscriptionSchedule.insertMany(rows, { ordered: false });
  }

  return { subscription: normalizeSubscription(subscription.toObject()) };
}

export async function listSubscriptionsForUser(userId) {
  const subscriptions = await FoodSubscription.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean();
    
  const enhancedSubscriptions = await Promise.all(subscriptions.map(async (sub) => {
    const remainingMeals = await FoodSubscriptionSchedule.countDocuments({
      subscriptionId: sub._id,
      isSkipped: false,
      fulfillmentStatus: { $in: ['pending', 'ready_for_assignment'] }
    });
    return { ...sub, remainingMeals };
  }));

  return {
    subscriptions: enhancedSubscriptions.map((subscription) => normalizeSubscription(subscription)),
  };
}

export async function getCurrentSubscriptionForUser(userId) {
  const subscription = await FoodSubscription.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    status: { $in: ['active', 'paused', 'pending_payment'] },
  })
    .sort({ createdAt: -1 })
    .lean();
  if (!subscription) {
    return { subscription: null, today: null };
  }

  const remainingMeals = await FoodSubscriptionSchedule.countDocuments({
    subscriptionId: subscription._id,
    isSkipped: false,
    fulfillmentStatus: { $in: ['pending', 'ready_for_assignment'] }
  });
  subscription.remainingMeals = remainingMeals;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);
  const today = await FoodSubscriptionSchedule.findOne({
    subscriptionId: subscription._id,
    serviceDate: { $gte: todayStart, $lte: todayEnd },
  }).lean();

  return {
    subscription: normalizeSubscription(subscription, today ? [today] : []),
    today,
  };
}

export async function listUpcomingSchedulesForUser(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  end.setHours(23, 59, 59, 999);

  const schedules = await FoodSubscriptionSchedule.find({
    userId: new mongoose.Types.ObjectId(userId),
    serviceDate: { $gte: start, $lte: end },
  })
    .populate('subscriptionId')
    .sort({ serviceDate: 1 })
    .lean();

  const now = new Date();
  const enhancedSchedules = schedules.map(schedule => {
    const sub = schedule.subscriptionId || {};
    const plan = sub.planSnapshot || {};
    
    let canChangeDish = plan.enableMealCustomization !== false;
    if (canChangeDish && plan.customizationCutoffTime) {
      const cutoff = parseCutoffDate(schedule.serviceDate, plan.customizationCutoffTime);
      if (cutoff && now > cutoff) canChangeDish = false;
    }
    
    let canChangeAddress = plan.enableAddressChange !== false;
    if (canChangeAddress && plan.addressChangeCutoffTime) {
      const cutoff = parseCutoffDate(schedule.serviceDate, plan.addressChangeCutoffTime);
      if (cutoff && now > cutoff) canChangeAddress = false;
    }
    
    let canSkip = plan.enableSkipDelivery !== false;
    if (canSkip && plan.customizationCutoffTime) {
      const cutoff = parseCutoffDate(schedule.serviceDate, plan.customizationCutoffTime);
      if (cutoff && now > cutoff) canSkip = false;
    }

    return {
      ...schedule,
      subscriptionId: sub._id,
      canChangeDish,
      canChangeAddress,
      canSkip
    };
  });

  return { schedules: enhancedSchedules };
}

export async function changeSubscriptionAddress(userId, subscriptionId, dto = {}) {
  const subscription = await findUserSubscription(userId, subscriptionId);
  if (!['active', 'paused', 'pending_payment'].includes(subscription.status)) {
    throw new ValidationError('Subscription cannot be updated');
  }

  const newAddress = buildAddress(dto.deliveryAddress, {
    customerName: subscription.customerName,
    customerPhone: subscription.customerPhone,
  });
  if (!newAddress.street || !newAddress.city || !newAddress.state) {
    throw new ValidationError('Delivery address is required');
  }

  ensureEditableBeforeCutoff(
    subscription.startDate || new Date(),
    subscription.planSnapshot?.addressChangeCutoffTime,
    'Address change window has closed for this subscription',
  );

  subscription.deliveryAddress = newAddress;
  addAuditLog(subscription, 'subscription_address_changed', 'USER', userId, 'Delivery address updated');
  await subscription.save();

  await FoodSubscriptionSchedule.updateMany(
    {
      subscriptionId: subscription._id,
      fulfillmentStatus: { $in: ['pending', 'ready_for_assignment'] },
      isSkipped: false,
    },
    {
      $set: {
        deliveryAddress: newAddress,
        isAddressChanged: true,
        addressChangedAt: new Date(),
      },
    },
  );

  return { subscription: normalizeSubscription(subscription.toObject()) };
}

export async function customizeSubscriptionItems(userId, scheduleId, dto = {}) {
  const schedule = await findUserSchedule(userId, scheduleId);
  const subscription = await FoodSubscription.findById(schedule.subscriptionId).lean();
  if (!subscription) throw new NotFoundError('Subscription not found');
  if (subscription.planSnapshot?.enableMealCustomization === false) {
    throw new ValidationError('Meal customization is disabled for this plan');
  }
  ensureEditableBeforeCutoff(
    schedule.serviceDate,
    subscription.planSnapshot?.customizationCutoffTime,
    'Meal customization cutoff time has passed',
  );

  schedule.mealSelections = dto.mealSelections || {};
  schedule.isCustomized = true;
  schedule.customizedAt = new Date();
  if (!Array.isArray(schedule.auditLogs)) schedule.auditLogs = [];
  schedule.auditLogs.push({
    action: 'meal_customized',
    byRole: 'USER',
    byId: String(userId),
    note: 'Subscription meal customized',
    createdAt: new Date(),
  });
  await schedule.save();

  return { schedule };
}

export async function skipSubscriptionSchedule(userId, scheduleId, dto = {}) {
  const schedule = await findUserSchedule(userId, scheduleId);
  const subscription = await FoodSubscription.findById(schedule.subscriptionId).lean();
  if (!subscription) throw new NotFoundError('Subscription not found');
  if (subscription.planSnapshot?.enableSkipDelivery === false) {
    throw new ValidationError('Skip delivery is disabled for this plan');
  }
  ensureEditableBeforeCutoff(
    schedule.serviceDate,
    subscription.planSnapshot?.customizationCutoffTime,
    'Skip delivery cutoff time has passed',
  );

  const skippedCount = await FoodSubscriptionSchedule.countDocuments({
    subscriptionId: schedule.subscriptionId,
    isSkipped: true,
  });
  if (Number(subscription.planSnapshot?.skipLimit || 0) > 0 && skippedCount >= Number(subscription.planSnapshot.skipLimit)) {
    throw new ValidationError('Skip limit exceeded for this plan');
  }

  schedule.isSkipped = true;
  schedule.skippedAt = new Date();
  schedule.skipReason = String(dto.reason || '').trim();
  schedule.fulfillmentStatus = 'skipped';
  if (!Array.isArray(schedule.auditLogs)) schedule.auditLogs = [];
  schedule.auditLogs.push({
    action: 'delivery_skipped',
    byRole: 'USER',
    byId: String(userId),
    note: schedule.skipReason || 'Delivery skipped by user',
    createdAt: new Date(),
  });
  await schedule.save();

  // Find the last schedule to append a new one
  const lastSchedule = await FoodSubscriptionSchedule.findOne({ subscriptionId: schedule.subscriptionId })
    .sort({ serviceDate: -1 })
    .lean();
  
  if (lastSchedule && lastSchedule.serviceDate) {
    const nextDate = new Date(lastSchedule.serviceDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Create new schedule
    await FoodSubscriptionSchedule.create({
      subscriptionId: subscription._id,
      userId: subscription.userId,
      planId: subscription.planId,
      serviceDate: nextDate,
      mealType: subscription.planSnapshot?.mealType || '',
      deliveryAddress: subscription.deliveryAddress,
      mealSelections: {},
      fulfillmentStatus: 'pending',
      auditLogs: [
        {
          action: 'schedule_created',
          byRole: 'SYSTEM',
          byId: '',
          note: 'Schedule created due to skip action',
          createdAt: new Date(),
        },
      ],
    });

    // Extend subscription endDate by 1 day
    if (subscription.endDate) {
      const newEndDate = new Date(subscription.endDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
      await FoodSubscription.updateOne(
        { _id: subscription._id },
        { $set: { endDate: newEndDate } }
      );
    }
  }

  return { schedule };
}

export async function listSubscriptionsAdmin(query = {}) {
  const filter = {};
  if (query.status) filter.status = String(query.status).trim();
  const subscriptions = await FoodSubscription.find(filter)
    .populate('userId', 'name phone email')
    .sort({ createdAt: -1 })
    .lean();
  return {
    subscriptions: subscriptions.map((subscription) => normalizeSubscription(subscription)),
  };
}

export async function getSubscriptionAdmin(subscriptionId) {
  const subscription = await FoodSubscription.findById(subscriptionId)
    .populate('userId', 'name phone email')
    .lean();
  if (!subscription) throw new NotFoundError('Subscription not found');
  const schedules = await FoodSubscriptionSchedule.find({ subscriptionId: subscription._id })
    .sort({ serviceDate: 1 })
    .lean();
  return {
    subscription: normalizeSubscription(subscription, schedules),
    schedules,
  };
}

export async function listTodaySubscriptionMealsAdmin(query = {}) {
  const baseDate = query.date ? new Date(query.date) : new Date();
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const schedules = await FoodSubscriptionSchedule.find({
    serviceDate: { $gte: start, $lte: end },
  })
    .populate('subscriptionId')
    .populate('userId', 'name phone email')
    .sort({ createdAt: 1 })
    .lean();

  const subscriptionIds = schedules.map(s => s.subscriptionId._id);
  const orders = await FoodOrder.find({
    'subscriptionUsage.subscriptionId': { $in: subscriptionIds },
    createdAt: { $gte: start, $lte: end }
  }).populate('dispatch.deliveryPartnerId', 'name phone').lean();

  const orderMap = {};
  for (const order of orders) {
    orderMap[order.subscriptionUsage.subscriptionId.toString()] = order;
  }

  for (const schedule of schedules) {
    schedule.order = orderMap[schedule.subscriptionId._id.toString()] || null;
  }

  return { schedules };
}

export async function updateSubscriptionScheduleStatusAdmin(scheduleId, status) {
  const schedule = await FoodSubscriptionSchedule.findById(scheduleId);
  if (!schedule) {
    throw new CustomError('Subscription schedule not found', 404);
  }

  const validStatuses = ['pending', 'ready_for_assignment', 'assigned', 'accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled', 'skipped'];
  if (!validStatuses.includes(status)) {
    throw new CustomError('Invalid status', 400);
  }

  schedule.fulfillmentStatus = status;
  
  if (status === 'delivered') {
    schedule.deliveredAt = new Date();
  }

  schedule.auditLogs.push({
    action: `Status updated to ${status}`,
    byRole: 'admin',
    note: 'Manual status update by admin',
    createdAt: new Date()
  });

  await schedule.save();
  return schedule;
}

export async function syncSubscriptionOrderStatus(order) {
  if (order.orderType === 'subscription' && order.subscriptionUsage && order.subscriptionUsage.planTitle) {
    const scheduleId = order.subscriptionUsage.planTitle;
    let status = order.orderStatus;
    
    // Map orderStatus to fulfillmentStatus
    const statusMap = {
      'created': 'pending',
      'pending': 'pending',
      'confirmed': 'accepted',
      'preparing': 'preparing', // though not in enum, we mapped to accepted if needed, wait, enum has 'accepted'. 
      // wait, the valid ones are: pending, ready_for_assignment, assigned, accepted, picked_up, on_the_way, delivered, cancelled, skipped
      'ready_for_pickup': 'picked_up',
      'picked_up': 'picked_up',
      'food_on_the_way': 'on_the_way',
      'delivered': 'delivered',
      'cancelled_by_restaurant': 'cancelled',
      'cancelled_by_user': 'cancelled',
      'cancelled_by_admin': 'cancelled'
    };

    if (status === 'preparing') status = 'accepted'; // fallback if not in enum
    if (status === 'out_for_delivery' || status === 'food_on_the_way') status = 'on_the_way';
    
    let targetStatus = statusMap[status] || status;

    // Check if targetStatus is valid
    const validStatuses = ['pending', 'ready_for_assignment', 'assigned', 'accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled', 'skipped'];
    if (!validStatuses.includes(targetStatus)) {
       // fallback mapping just in case
       if (status === 'out_for_delivery') targetStatus = 'on_the_way';
       else targetStatus = 'accepted'; 
    }

    try {
      const schedule = await FoodSubscriptionSchedule.findById(scheduleId);
      if (schedule && schedule.fulfillmentStatus !== targetStatus) {
        schedule.fulfillmentStatus = targetStatus;
        if (targetStatus === 'delivered') schedule.deliveredAt = new Date();
        
        schedule.auditLogs.push({
          action: `Auto sync to ${targetStatus}`,
          byRole: 'system',
          note: `Synced from order status ${order.orderStatus}`,
          createdAt: new Date()
        });
        
        await schedule.save();
      }
    } catch (err) {
      console.error('[syncSubscriptionOrderStatus] Failed to sync status:', err);
    }
  }
}

export async function sendSubscriptionMealToDeliveryAdmin(scheduleId) {
  const schedule = await FoodSubscriptionSchedule.findById(scheduleId).populate('subscriptionId');
  if (!schedule) throw new NotFoundError('Subscription day not found');
  if (schedule.isSkipped) {
    throw new ValidationError('Skipped subscription day cannot be dispatched');
  }
  schedule.fulfillmentStatus = 'ready_for_assignment';
  if (!Array.isArray(schedule.auditLogs)) schedule.auditLogs = [];
  schedule.auditLogs.push({
    action: 'ready_for_assignment',
    byRole: 'ADMIN',
    byId: '',
    note: 'Marked ready for rider assignment',
    createdAt: new Date(),
  });
  
  let order = await FoodOrder.findOne({ 
    orderType: 'subscription', 
    'subscriptionUsage.subscriptionId': schedule.subscriptionId._id,
    'subscriptionUsage.planTitle': scheduleId.toString() // We use planTitle as scheduleId for matching
  });

  if (!order) {
    const sub = schedule.subscriptionId;
    const address = buildAddress(sub.deliveryAddress, { customerName: sub.customerName, customerPhone: sub.customerPhone });
    
    order = new FoodOrder({
      userId: schedule.userId || sub.userId,
      orderType: 'subscription',
      items: [{
        itemId: schedule._id.toString(),
        name: schedule.dishName || 'Subscription Meal',
        price: 0,
        quantity: 1,
        isVeg: true
      }],
      deliveryAddress: address,
      pricing: { subtotal: 0, total: 0 },
      payment: {
        method: 'subscription',
        status: 'paid'
      },
      orderStatus: 'preparing',
      subscriptionUsage: {
        subscriptionId: sub._id,
        planTitle: scheduleId.toString() // Storing scheduleId here temporarily
      }
    });
    await order.save();
  }

  await schedule.save();
  return { schedule, order };
}

export async function sendTestSubscriptionReminder(type = 'subscription') {
  return {
    sent: false,
    type,
    message: 'Legacy subscription reminder flow removed. Build the new reminder flow on top of the fresh subscription module.',
  };
}

export async function syncSubscriptionScheduleReminders() {
  return {
    success: true,
    sent: 0,
    message: 'Legacy subscription schedule reminder sync removed. Build the new scheduler on top of the fresh subscription module.',
  };
}

