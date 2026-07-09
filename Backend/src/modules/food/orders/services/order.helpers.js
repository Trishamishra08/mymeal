import mongoose from 'mongoose';
import { logger } from '../../../../utils/logger.js';
import {
  sendNotificationToOwner,
  sendNotificationToOwners,
  notifyAdminsSafely,
} from "../../../../core/notifications/firebase.service.js";
import { getIO, rooms } from '../../../../config/socket.js';
import { addOrderJob } from '../../../../queues/producers/order.producer.js';

import { getSingleKitchenContext } from '../../shared/singleKitchen.service.js';

export async function injectAdminBusinessLocation(data) {
  if (!data) return data;

  let fallbackSettings = null;

  const inject = async (out) => {
    if (!out) return out;
    const source = out.restaurantId || out.restaurant || null;
    const location = source?.location || {};
    if (source) {
      out.restaurantName = source.restaurantName || source.name || out.restaurantName || '';
      out.restaurantPhone = source.phone || source.ownerPhone || out.restaurantPhone || '';
      out.restaurantAddress =
        source.address ||
        source.addressLine1 ||
        location.formattedAddress ||
        location.address ||
        out.restaurantAddress ||
        '';
      if (
        Number.isFinite(Number(location?.coordinates?.[1])) &&
        Number.isFinite(Number(location?.coordinates?.[0]))
      ) {
        out.restaurantLocation = {
          latitude: Number(location.coordinates[1]),
          longitude: Number(location.coordinates[0]),
          address:
            location.address || location.formattedAddress || out.restaurantAddress || '',
          area: location.area || '',
          city: location.city || '',
          state: location.state || '',
        };
      }
    }

    if (!out.restaurantLocation || !out.restaurantName || !out.restaurantAddress) {
      if (!fallbackSettings) {
         try {
           fallbackSettings = await getSingleKitchenContext();
         } catch(e) {}
      }
      if (fallbackSettings?.pickupHub) {
         const hub = fallbackSettings.pickupHub;
         out.restaurantName = out.restaurantName || hub.name || 'Admin Kitchen';
         out.restaurantPhone = out.restaurantPhone || hub.phone || '';
         out.restaurantAddress = out.restaurantAddress || hub.address || '';
         if (!out.restaurantLocation && hub.location?.coordinates?.length === 2) {
            out.restaurantLocation = {
                latitude: Number(hub.location.coordinates[1]),
                longitude: Number(hub.location.coordinates[0]),
                address: hub.address || '',
                area: '', city: '', state: ''
            };
         }
      }
    }

    delete out.restaurantId;
    delete out.restaurant;
    return out;
  };

  if (Array.isArray(data)) {
      return Promise.all(data.map(inject));
  }
  return inject(data);
}

export function enqueueOrderEvent(action, payload = {}) {
  try {
    void addOrderJob({ action, ...payload }).catch((err) => {
      logger.warn(`BullMQ enqueue order event failed: ${action} - ${err?.message || err}`);
    });
  } catch (err) {
    logger.warn(`BullMQ enqueue order event failed (sync): ${action} - ${err?.message || err}`);
  }
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function generateFourDigitDeliveryOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function sanitizeOrderForExternal(orderDoc) {
  const o = orderDoc?.toObject ? orderDoc.toObject() : { ...(orderDoc || {}) };
  delete o.deliveryOtp;
  delete o.pickupOtp;
  const dv = o.deliveryVerification;
  if (dv) {
    const d = dv.dropOtp || {};
    const p = dv.pickupOtp || {};
    o.deliveryVerification = {
      ...dv,
      dropOtp: {
        required: Boolean(d.required),
        verified: Boolean(d.verified),
      },
      pickupOtp: {
        required: Boolean(p.required !== false),
        verified: Boolean(p.verified),
      }
    };
  }
  o.orderMongoId = (o._id || orderDoc?._id || "").toString();
  // Ensure orderId field for UI always contains the pretty ID
  o.orderId = o.order_id || o.orderMongoId;
  return o;
}

export function emitDeliveryDropOtpToUser(order, plainOtp) {
  try {
    const io = getIO();
    if (!io || !plainOtp || !order?.userId) return;
    io.to(rooms.user(order.userId)).emit("delivery_drop_otp", {
      orderMongoId: order._id?.toString?.(),
      orderId: order.order_id || order._id?.toString?.(),
      otp: plainOtp,
      message:
        "Share this OTP with your delivery partner to hand over the order.",
    });
  } catch (e) {
    logger.warn(`emitDeliveryDropOtpToUser failed: ${e?.message || e}`);
  }
}

export async function notifyOwnersSafely(targets, payload) {
  try {
    await sendNotificationToOwners(targets, payload);
  } catch (error) {
    logger.warn(`FCM notification failed: ${error?.message || error}`);
  }
}

export async function notifyOwnerSafely(target, payload) {
  try {
    await sendNotificationToOwner({ ...target, payload });
  } catch (error) {
    logger.warn(`FCM notification failed: ${error?.message || error}`);
  }
}

export function buildOrderIdentityFilter(orderIdOrMongoId) {
  const raw = String(orderIdOrMongoId || "").trim();
  if (!raw) return null;
  if (mongoose.isValidObjectId(raw))
    return { _id: new mongoose.Types.ObjectId(raw) };

  // Search BOTH underscore and camelCase variants for robust lookup
  return {
    $or: [
        { order_id: raw },
        { orderId: raw }
    ]
  };
}

export function toGeoPoint(lat, lng) {
  if (lat == null || lng == null) return undefined;
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return undefined;
  return { type: "Point", coordinates: [b, a] };
}

export function pushStatusHistory(order, { byRole, byId, from, to, note = "" }) {
  order.statusHistory.push({
    at: new Date(),
    byRole,
    byId: byId || undefined,
    from,
    to,
    note,
  });
}

export function normalizeOrderForClient(orderDoc) {
  const order = orderDoc?.toObject ? orderDoc.toObject() : orderDoc || {};
  const mongoId = (order._id || orderDoc?._id || "").toString();
  const displayId = order.order_id || mongoId;
  
  const restLoc = order.restaurantId?.location || order.restaurant?.location || {};
  const restaurantLocation = {
    latitude: restLoc.latitude || restLoc.coordinates?.[1] || null,
    longitude: restLoc.longitude || restLoc.coordinates?.[0] || null,
    address: restLoc.address || restLoc.formattedAddress || "",
    area: restLoc.area || "",
    city: restLoc.city || "",
    state: restLoc.state || ""
  };
  
  delete order.restaurantId;
  delete order.restaurant;
  delete order.restaurantName;
  delete order.restaurantAddress;
  delete order.restaurantPhone;
  
  return {
    ...order,
    restaurantLocation,
    orderMongoId: mongoId,
    orderId: displayId,
    status: order?.orderStatus || order?.status || "",
    deliveredAt:
      order?.deliveryState?.deliveredAt || order?.deliveredAt || null,
    deliveryPartnerId:
      order?.dispatch?.deliveryPartnerId || order?.deliveryPartnerId || null,
    rating: order?.ratings?.restaurant?.rating ?? order?.rating ?? null,
    restaurantNote: order?.restaurantNote || "",
    cancellationReason: (order?.orderStatus?.includes('cancel') || order?.status?.includes('cancel'))
      ? (order.statusHistory?.findLast(h => h.to?.includes('cancel'))?.note || "")
      : null,
    deliveryState: {
      ...(order?.deliveryState || {}),
      currentLocation: order?.lastRiderLocation?.coordinates?.length >= 2 ? {
        lat: order.lastRiderLocation.coordinates[1],
        lng: order.lastRiderLocation.coordinates[0]
      } : (order?.deliveryState?.currentLocation || null)
    }
  };
}

export async function applyAggregateRating(model, entityId, newRating) {
  if (!entityId) return;
  const doc = await model.findById(entityId).select("rating totalRatings");
  if (!doc) return;

  const totalRatings = Number(doc.totalRatings || 0);
  const currentAverage = Number(doc.rating || 0);
  const nextTotal = totalRatings + 1;
  const nextAverage = Number(
    ((currentAverage * totalRatings + Number(newRating)) / nextTotal).toFixed(1),
  );

  doc.totalRatings = nextTotal;
  doc.rating = nextAverage;
  await doc.save();
}

export function buildDeliverySocketPayload(orderDoc, restaurantDoc = null) {
  const order = orderDoc?.toObject ? orderDoc.toObject() : orderDoc || {};
  const restaurant = restaurantDoc || order?.restaurantId || null;
  const restaurantLocation = restaurant?.location || {};
  const deliveryAddress = order?.deliveryAddress || {};
  const customerAddressParts = [
    deliveryAddress.street,
    deliveryAddress.additionalDetails,
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.zipCode,
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean);

  return {
    orderMongoId:
      orderDoc?._id?.toString?.() || order?._id?.toString?.() || order?._id,
    orderId: order?.order_id || order?._id?.toString?.(),
    status: orderDoc?.orderStatus || order?.orderStatus,
    items: order?.items || [],
    orderType: order?.orderType || "regular",
    tiffinOrder: order?.tiffinOrder || null,
    pricing: order?.pricing,
    total: order?.pricing?.total,
    payment: order?.payment,
    paymentMethod: order?.payment?.method,
    restaurantName: restaurant?.restaurantName || restaurant?.name || '',
    restaurantPhone: restaurant?.phone || restaurant?.ownerPhone || '',
    restaurantAddress:
      restaurant?.address ||
      restaurant?.addressLine1 ||
      restaurantLocation?.formattedAddress ||
      restaurantLocation?.address ||
      '',
    restaurantLocation:
      Array.isArray(restaurantLocation?.coordinates) &&
      restaurantLocation.coordinates.length >= 2
        ? {
            latitude: Number(restaurantLocation.coordinates[1]),
            longitude: Number(restaurantLocation.coordinates[0]),
            address:
              restaurantLocation.address || restaurantLocation.formattedAddress || '',
            area: restaurantLocation.area || '',
            city: restaurantLocation.city || '',
            state: restaurantLocation.state || '',
          }
        : null,
    deliveryAddress: order?.deliveryAddress,
    customerAddress: customerAddressParts.length ? customerAddressParts.join(', ') : "",
    customerName: order?.customerName || order?.deliveryAddress?.fullName || order?.deliveryAddress?.name || order?.userId?.name || "",
    customerPhone: order?.customerPhone || order?.deliveryAddress?.phone || order?.userId?.phone || "",
    userName: order?.customerName || order?.deliveryAddress?.fullName || order?.deliveryAddress?.name || order?.userId?.name || "",
    userPhone: order?.customerPhone || order?.deliveryAddress?.phone || order?.userId?.phone || "",
    note: order?.note || "",
    riderEarning: order?.riderEarning || 0,
    deliveryBonusAmount: order?.deliveryBonusAmount || 0,
    earnings: order?.riderEarning || order?.pricing?.deliveryFee || 0,
    deliveryFee: order?.pricing?.deliveryFee || 0,
    deliveryFleet: order?.deliveryFleet,
    dispatch: order?.dispatch,
    createdAt: order?.createdAt,
    updatedAt: order?.updatedAt,
  };
}

export function canExposeOrderToKitchen(orderLike) {
  const method = String(orderLike?.payment?.method || "").toLowerCase();
  const status = String(orderLike?.payment?.status || "").toLowerCase();
  if (["cash", "wallet"].includes(method)) return true;
  return ["paid", "authorized", "captured", "settled"].includes(status);
}

export async function notifyRestaurantNewOrder(orderDoc) {
  try {
    if (!orderDoc || !canExposeOrderToKitchen(orderDoc)) return;

    const io = getIO();
    if (io) {
      const payload = {
        ...orderDoc.toObject(),
        orderMongoId: orderDoc._id?.toString?.() || undefined,
        orderId: orderDoc.order_id || orderDoc._id?.toString?.(),
      };
      logger.info(
        `[AdminKitchenOrders] Emitting new_order to admin room for order ${orderDoc._id?.toString?.() || ''}`,
      );
      io.to('admin').emit("new_order", payload);
    }

    await notifyAdminsSafely(
      {
        title: "New kitchen order received",
        body: `Order #${orderDoc.order_id || orderDoc._id} is waiting for review.`,
        data: {
          type: "new_order",
          orderId: orderDoc._id.toString(),
          orderMongoId: orderDoc._id?.toString?.() || "",
          link: `/food/admin/orders/${orderDoc._id?.toString?.() || ""}`,
        },
      },
    );
  } catch {
    // Do not block order/payment flow if notification fails.
  }
}

export const STATUS_PRIORITY = {
  created: 10,
  confirmed: 20,
  preparing: 30,
  ready_for_pickup: 40,
  reached_pickup: 50,
  picked_up: 60,
  reached_drop: 70,
  delivered: 80,
  cancelled_by_user: 100,
  cancelled_by_restaurant: 100,
  cancelled_by_admin: 100,
  dead: 100,
};

/**
 * Returns true if the next status is a valid forward progression from the current status.
 * Prevents "reversing" order status (e.g. from Preparing back to Created).
 */
export function isStatusAdvance(current, next) {
  // If current status is missing, it's effectively 'created' or start of flow
  if (!current) return true;

  const currentPrio = STATUS_PRIORITY[current] || 0;
  const nextPrio = STATUS_PRIORITY[next] || 0;

  // Terminal states (100) cannot transition to anything else
  if (currentPrio >= 100) return false;

  // Delivered (80) cannot transition to anything (except maybe cancellation if allowed, but here we say no)
  if (currentPrio === 80) return false;

  // Special case: Cancellation is almost always an advance unless already delivered
  if (nextPrio === 100 && currentPrio < 80) return true;

  return nextPrio > currentPrio;
}

