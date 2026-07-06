import mongoose from 'mongoose';
import { FoodOrder } from '../models/order.model.js';
import { FoodOfferUsage } from '../../admin/models/offerUsage.model.js';
import { FoodFeeSettings } from '../../admin/models/feeSettings.model.js';
import { FoodRestaurant } from '../../restaurant/models/restaurant.model.js';
import { FoodOffer } from '../../admin/models/offer.model.js';
import { MyMealDailyMenu } from '../../admin/models/dailyMenu.model.js';
import { MyMealMenuCategory } from '../../admin/models/menuCategory.model.js';
import { MyMealMenuItem } from '../../admin/models/menuItem.model.js';
import { FoodUser } from '../../../../core/users/user.model.js';
import { ValidationError, NotFoundError } from '../../../../core/auth/errors.js';
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  isRazorpayConfigured,
  verifyPaymentSignature,
} from '../helpers/razorpay.helper.js';
import {
  normalizeOrderForClient,
  notifyOwnersSafely,
  notifyRestaurantNewOrder,
  pushStatusHistory,
} from './order.helpers.js';
import * as foodTransactionService from './foodTransaction.service.js';

const MAX_TIFFIN_QUANTITY = 10;

function toDateKey(value) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const date = value ? new Date(value) : new Date();
  const ist = new Date(date.getTime() + 330 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function idString(value) {
  return value?._id?.toString?.() || value?.toString?.() || '';
}

function sanitizeAddress(address = {}, user = null) {
  const street = String(address.street || address.addressLine1 || address.fullAddress || '').trim();
  const city = String(address.city || '').trim();
  const state = String(address.state || '').trim();
  if (!street || !city || !state) {
    throw new ValidationError('Delivery address with street, city, and state is required');
  }
  return {
    label: address.label || 'Home',
    name: address.name || address.fullName || user?.name || '',
    fullName: address.fullName || address.name || user?.name || '',
    street,
    additionalDetails: address.additionalDetails || address.landmark || '',
    city,
    state,
    zipCode: address.zipCode || address.pincode || address.postalCode || '',
    phone: address.phone || user?.phone || '',
    location: address.location?.coordinates?.length === 2
      ? { type: 'Point', coordinates: address.location.coordinates.map(Number) }
      : undefined,
  };
}

async function getActiveFeeSettings() {
  return FoodFeeSettings.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
}

function normalizeSnapshotRow(row) {
  const categoryId = idString(row.categoryId);
  const defaultItem = row.defaultItem || row.items?.[0] || null;
  const items = (row.items || []).map((item) => ({
    itemId: idString(item.itemId),
    name: item.itemName || item.name || '',
    price: Number(item.price || 0),
    imageUrl: item.imageUrl || '',
    defaultQuantity: item.defaultQuantity || '',
    available: true,
  })).filter((item) => item.itemId && item.name);

  return {
    categoryId,
    categoryName: row.categoryName || '',
    defaultItem: defaultItem ? {
      itemId: idString(defaultItem.itemId),
      name: defaultItem.itemName || defaultItem.name || '',
      price: Number(defaultItem.price || 0),
      imageUrl: defaultItem.imageUrl || '',
      defaultQuantity: defaultItem.defaultQuantity || '',
    } : null,
    items,
  };
}

async function buildFallbackMenu() {
  const categories = await MyMealMenuCategory.find({ status: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  if (!categories.length) return [];

  const categoryIds = categories.map((category) => category._id);
  const items = await MyMealMenuItem.find({
    categoryId: { $in: categoryIds },
    status: true,
    availability: true,
  }).sort({ name: 1 }).lean();

  const byCategory = new Map();
  for (const item of items) {
    const key = idString(item.categoryId);
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(item);
  }

  return categories.map((category) => {
    const options = byCategory.get(idString(category._id)) || [];
    const mapped = options.map((item) => ({
      itemId: idString(item._id),
      name: item.name,
      price: Number(item.price || 0),
      imageUrl: item.imageUrl || category.imageUrl || '',
      defaultQuantity: item.defaultQuantity || '',
      available: true,
    }));
    return {
      categoryId: idString(category._id),
      categoryName: category.name,
      defaultItem: mapped[0] || null,
      items: mapped,
    };
  }).filter((row) => row.defaultItem);
}

async function buildMenu(dateKey) {
  const dailyMenu = await MyMealDailyMenu.findOne({ menuDate: dateKey }).lean()
    || await MyMealDailyMenu.findOne({}).sort({ menuDate: -1, createdAt: -1 }).lean();

  let rows = [];
  if (dailyMenu?.snapshot?.length) {
    rows = dailyMenu.snapshot.map(normalizeSnapshotRow).filter((row) => row.defaultItem);
  } else {
    rows = await buildFallbackMenu();
  }

  if (!rows.length) {
    throw new ValidationError('Daily menu is not configured yet');
  }

  const categoryIds = rows.map((row) => row.categoryId).filter(mongoose.Types.ObjectId.isValid);
  const freshItems = await MyMealMenuItem.find({
    categoryId: { $in: categoryIds },
    status: true,
    availability: true,
  }).sort({ name: 1 }).lean();

  const freshByCategory = new Map();
  for (const item of freshItems) {
    const key = idString(item.categoryId);
    if (!freshByCategory.has(key)) freshByCategory.set(key, []);
    freshByCategory.get(key).push({
      itemId: idString(item._id),
      name: item.name,
      price: Number(item.price || 0),
      imageUrl: item.imageUrl || '',
      defaultQuantity: item.defaultQuantity || '',
      available: true,
    });
  }

  return rows.map((row) => ({
    ...row,
    items: freshByCategory.get(row.categoryId)?.length ? freshByCategory.get(row.categoryId) : row.items,
  }));
}

export async function getOneTimeTiffinMenu(query = {}) {
  const menuDate = toDateKey(query.date);
  const [feeSettings, rows] = await Promise.all([getActiveFeeSettings(), buildMenu(menuDate)]);
  return {
    menuDate,
    price: Number(feeSettings?.oneTimeTiffinPrice || 0),
    deliveryFee: Number(feeSettings?.deliveryFee || 0),
    currency: 'INR',
    categories: rows,
  };
}

function normalizeQuantity(value) {
  const quantity = Math.floor(Number(value || 1));
  if (!Number.isFinite(quantity) || quantity < 1) throw new ValidationError('Quantity must be at least 1');
  if (quantity > MAX_TIFFIN_QUANTITY) throw new ValidationError(`Quantity cannot exceed ${MAX_TIFFIN_QUANTITY}`);
  return quantity;
}

function buildTiffins(rows, dtoTiffins, quantity) {
  const tiffins = [];
  for (let index = 0; index < quantity; index += 1) {
    const sentItems = Array.isArray(dtoTiffins?.[index]?.items) ? dtoTiffins[index].items : [];
    const sentByCategory = new Map(sentItems.map((item) => [String(item.categoryId || ''), String(item.selectedItemId || '')]));
    const items = rows.map((row) => {
      const selectedItemId = sentByCategory.get(row.categoryId) || row.defaultItem.itemId;
      const selected = row.items.find((item) => item.itemId === selectedItemId) || row.defaultItem;
      if (!selected || selected.itemId !== selectedItemId) {
        throw new ValidationError(`Selected item is not available for ${row.categoryName}`);
      }
      return {
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        defaultItemId: row.defaultItem.itemId,
        defaultItemName: row.defaultItem.name,
        selectedItemId: selected.itemId,
        selectedItemName: selected.name,
        imageUrl: selected.imageUrl || row.defaultItem.imageUrl || '',
        defaultQuantity: selected.defaultQuantity || row.defaultItem.defaultQuantity || '',
        customized: selected.itemId !== row.defaultItem.itemId,
      };
    });
    tiffins.push({
      index: index + 1,
      customized: items.some((item) => item.customized),
      items,
    });
  }
  return tiffins;
}

export async function createOneTimeTiffinOrder(userId, dto = {}) {
  if (!userId) throw new ValidationError('Login required');
  const [user, feeSettings, primaryRestaurant] = await Promise.all([
    FoodUser.findById(userId).select('name phone').lean(),
    getActiveFeeSettings(),
    FoodRestaurant.findOne({}).lean()
  ]);
  const unitPrice = Number(feeSettings?.oneTimeTiffinPrice || 0);
  if (!unitPrice || unitPrice <= 0) {
    throw new ValidationError('One-time tiffin price is not configured');
  }

  const quantity = normalizeQuantity(dto.quantity);
  const menuDate = toDateKey(dto.menuDate);
  const rows = await buildMenu(menuDate);
  const tiffins = buildTiffins(rows, Array.isArray(dto.tiffins) ? dto.tiffins : [], quantity);
  const deliveryAddress = sanitizeAddress(dto.address || dto.deliveryAddress || {}, user);
  const subtotal = unitPrice * quantity;

  let deliveryFee = Number(feeSettings?.deliveryFee || 0);
  const freeUpTo = Number(feeSettings?.freeDeliveryUpTo || 0);
  const freeThreshold = Number(feeSettings?.freeDeliveryThreshold || 149);

  if (Number.isFinite(freeUpTo) && freeUpTo > 0 && subtotal >= freeUpTo) {
    deliveryFee = 0;
  } else if (subtotal >= freeThreshold) {
    deliveryFee = 0;
  }

  const platformFee = Number(feeSettings?.platformFee || 0);
  const packagingFee = Number(feeSettings?.packagingFee || 0);

  const gstOnItemTotal = subtotal * (Number(feeSettings?.gstRate || 0) / 100);
  const gstOnDeliveryFee = deliveryFee * (Number(feeSettings?.gstOnDeliveryFee || 0) / 100);
  const gstOnPlatformFee = platformFee * (Number(feeSettings?.gstOnPlatformFee || 0) / 100);
  const gstOnPackagingFee = packagingFee * (Number(feeSettings?.gstOnPackagingFee || 0) / 100);
  const tax = Math.round(gstOnItemTotal + gstOnDeliveryFee + gstOnPlatformFee + gstOnPackagingFee);

  let discount = 0;
  let appliedCoupon = null;
  let couponError = null;
  const couponCode = dto.couponCode ? String(dto.couponCode).trim().toUpperCase() : null;

  if (couponCode) {
    let offer = await FoodOffer.findOne({ couponCode }).lean();
    
    if (!offer) {
      const { default: Promocode } = await import('../../../../models/Promocode.js');
      const promo = await Promocode.findOne({ code: couponCode }).lean();
      if (promo) {
        offer = {
          _id: promo._id,
          status: promo.isActive ? "active" : "inactive",
          startDate: promo.startDate,
          endDate: promo.expiryDate,
          minOrderValue: promo.minOrderAmount || 0,
          usageLimit: promo.usageLimit || 0,
          usedCount: promo.usageCount || 0,
          discountType: promo.discountType === 'PERCENTAGE' ? 'percentage' : 'flat-price',
          discountValue: promo.discountValue,
          maxDiscount: promo.maxDiscountAmount || 0,
        };
      }
    }

    if (!offer) {
      couponError = "Invalid or expired coupon code.";
    } else if (offer.status !== 'active') {
      couponError = "This coupon is no longer active.";
    } else if (offer.startDate && new Date(offer.startDate).getTime() > Date.now()) {
      couponError = "This coupon is not yet valid.";
    } else if (offer.endDate && new Date(offer.endDate).getTime() < Date.now()) {
      couponError = "This coupon has expired.";
    } else if (offer.minOrderValue && subtotal < offer.minOrderValue) {
      couponError = `Minimum order value of ₹${offer.minOrderValue} required for this coupon.`;
    } else if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
      couponError = "Coupon usage limit reached.";
    } else {
      // Valid coupon
      if (offer.discountType === 'flat-price') {
        discount = Math.min(subtotal, Math.floor(Number(offer.discountValue) || 0));
      } else {
        const rawDiscount = subtotal * (Number(offer.discountValue) / 100);
        const capped = offer.maxDiscount ? Math.min(rawDiscount, Number(offer.maxDiscount)) : rawDiscount;
        discount = Math.max(0, Math.min(subtotal, Math.floor(capped)));
      }
      appliedCoupon = { code: couponCode, discount };
    }
    
    if (couponError) {
      throw new ValidationError(couponError);
    }
  }

  const totalBeforeDiscount = subtotal + tax + packagingFee + deliveryFee + platformFee;
  const payableTotal = Math.max(0, subtotal - discount) + tax + packagingFee + deliveryFee + platformFee;

  const order = new FoodOrder({
    userId: new mongoose.Types.ObjectId(userId),
    items: [{
      itemId: 'one-time-tiffin',
      name: quantity > 1 ? `One-Time Tiffin x ${quantity}` : 'One-Time Tiffin',
      price: unitPrice,
      quantity,
      isVeg: true,
      image: rows[0]?.defaultItem?.imageUrl || '',
      notes: tiffins.some((tiffin) => tiffin.customized) ? 'Customized tiffin' : 'Default tiffin',
    }],
    restaurantId: primaryRestaurant?._id || undefined,
    deliveryAddress,
    customerName: dto.customerName || deliveryAddress.fullName || user?.name || '',
    customerPhone: dto.customerPhone || deliveryAddress.phone || user?.phone || '',
    pricing: {
      subtotal: subtotal,
      tax: tax,
      packagingFee: packagingFee,
      deliveryFee: deliveryFee,
      platformFee: platformFee,
      discount: discount,
      couponDiscount: discount > 0 ? discount : undefined,
      couponCode: appliedCoupon?.code || (couponCode && !couponError ? couponCode : null),
      appliedCoupon,
      couponError,
      originalTotal: totalBeforeDiscount,
      payableTotal: payableTotal,
      total: payableTotal,
      currency: 'INR',
    },
    payment: {
      method: 'razorpay',
      status: isRazorpayConfigured() ? 'created' : 'created',
      amountDue: payableTotal,
      razorpay: {},
      qr: {},
    },
    orderStatus: 'created',
    dispatch: { modeAtCreation: 'auto', status: 'unassigned' },
    orderType: 'one_time_tiffin',
    tiffinOrder: {
      quantity,
      unitPrice,
      menuDate,
      defaultItems: rows.map((row) => ({
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        itemId: row.defaultItem.itemId,
        itemName: row.defaultItem.name,
      })),
      tiffins,
    },
    statusHistory: [{
      at: new Date(),
      byRole: 'SYSTEM',
      from: '',
      to: 'created',
      note: 'One-time tiffin order created',
    }],
    note: dto.note || '',
    sendCutlery: false,
    riderEarning: 0,
    deliveryBonusAmount: 0,
    platformProfit: payableTotal,
  });

  let razorpayPayload = null;
  if (isRazorpayConfigured()) {
    const rzOrder = await createRazorpayOrder(Math.round(payableTotal * 100), 'INR', order._id.toString());
    order.payment.razorpay = { orderId: rzOrder.id, paymentId: '', signature: '' };
    razorpayPayload = {
      key: getRazorpayKeyId(),
      orderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency || 'INR',
    };
  }

  await order.save();

  if (couponCode && !couponError && appliedCoupon) {
    let offer = await FoodOffer.findOne({ couponCode }).lean();
    if (offer) {
      await FoodOffer.updateOne({ _id: offer._id }, { $inc: { usedCount: 1 } });
      await FoodOfferUsage.updateOne(
        { offerId: offer._id, userId: new mongoose.Types.ObjectId(userId) },
        {
          $inc: { count: 1 },
          $setOnInsert: { offerId: offer._id, userId: new mongoose.Types.ObjectId(userId) },
        },
        { upsert: true }
      );
    } else {
      const { default: Promocode } = await import('../../../../models/Promocode.js');
      await Promocode.updateOne({ code: couponCode }, { $inc: { usageCount: 1 } });
    }
  }

  await foodTransactionService.createInitialTransaction({
    ...(order.toObject?.() || order),
    pricing: order.pricing,
    payment: order.payment,
  });

  await notifyOwnersSafely([{ ownerType: 'USER', ownerId: userId }], {
    title: 'Complete Payment to Confirm Tiffin',
    body: `Your one-time tiffin order #${order.order_id || order._id} is created. Please complete online payment.`,
    data: {
      type: 'one_time_tiffin_created_pending_payment',
      orderId: String(order._id),
      link: `/food/user/orders/${order._id}`,
    },
  });

  return { order: normalizeOrderForClient(order), razorpay: razorpayPayload };
}

export async function verifyOneTimeTiffinPayment(userId, dto = {}) {
  const orderId = dto.orderId;
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) throw new ValidationError('Order id required');
  const order = await FoodOrder.findOne({
    _id: new mongoose.Types.ObjectId(orderId),
    userId: new mongoose.Types.ObjectId(userId),
    orderType: 'one_time_tiffin',
  });
  if (!order) throw new NotFoundError('Order not found');
  if (order.payment.status === 'paid') return { order: normalizeOrderForClient(order), payment: order.payment };

  if (isRazorpayConfigured()) {
    const valid = verifyPaymentSignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
    if (!valid) throw new ValidationError('Payment verification failed');
  }

  order.payment.status = 'paid';
  order.payment.razorpay.orderId = dto.razorpayOrderId || order.payment.razorpay.orderId || '';
  order.payment.razorpay.paymentId = dto.razorpayPaymentId || 'direct-test-payment';
  order.payment.razorpay.signature = dto.razorpaySignature || '';
  const previousStatus = order.orderStatus;
  order.orderStatus = 'created';
  pushStatusHistory(order, {
    byRole: 'USER',
    byId: userId,
    from: previousStatus,
    to: 'created',
    note: 'One-time tiffin payment verified',
  });
  await order.save();

  await foodTransactionService.updateTransactionStatus(order._id, 'captured', {
    status: 'captured',
    razorpayPaymentId: order.payment.razorpay.paymentId,
    razorpaySignature: order.payment.razorpay.signature,
    recordedByRole: 'USER',
    recordedById: new mongoose.Types.ObjectId(userId),
  });

  await notifyOwnersSafely([{ ownerType: 'USER', ownerId: userId }], {
    title: 'Payment Successful! ✅',
    body: `We have received your payment for order #${order.order_id || order._id}. Waiting for restaurant acceptance.`,
    data: {
      type: 'payment_success',
      orderId: String(order._id),
      link: `/food/user/orders/${order._id}`,
    },
  });

  // Notify restaurant/admin of the new tiffin order
  await notifyRestaurantNewOrder(order);

  return { order: normalizeOrderForClient(order), payment: order.payment };
}
