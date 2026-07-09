import mongoose from 'mongoose';
import { ValidationError } from '../../../core/auth/errors.js';
import { FoodBusinessSettings } from '../admin/models/businessSettings.model.js';


const KITCHEN_SELECT =
  'restaurantName ownerName ownerPhone ownerEmail primaryContactNumber status location zoneId isAcceptingOrders';

function buildAddressFromSettings(settings = {}) {
  const address = String(settings?.address || '').trim();
  const state = String(settings?.state || '').trim();
  const pincode = String(settings?.pincode || '').trim();
  return [address, state, pincode].filter(Boolean).join(', ');
}

export async function getSingleKitchenRestaurant() {
  const FoodRestaurant = mongoose.models.FoodRestaurant;
  if (!FoodRestaurant) {
    return null;
  }
  
  const restaurant =
    await FoodRestaurant.findOne({ status: 'approved' }).select(KITCHEN_SELECT).lean() ||
    await FoodRestaurant.findOne({}).select(KITCHEN_SELECT).lean();

  return restaurant || null;
}

export async function getSingleKitchenContext() {
  const [restaurant, settings] = await Promise.all([
    getSingleKitchenRestaurant(),
    FoodBusinessSettings.findOne().lean(),
  ]);

  const settingsCoordinates = Array.isArray(settings?.location?.coordinates)
    ? settings.location.coordinates
    : null;
  const restaurantCoordinates = Array.isArray(restaurant?.location?.coordinates)
    ? restaurant.location.coordinates
    : null;

  const coordinates =
    settingsCoordinates?.length === 2 ? settingsCoordinates : restaurantCoordinates;
  const addressFromSettings = buildAddressFromSettings(settings);

  const hubName =
    String(settings?.companyName || '').trim() ||
    String(restaurant?.restaurantName || '').trim() ||
    'Admin Kitchen';
  const hubPhone =
    String(settings?.phone?.number || '').trim() ||
    String(restaurant?.primaryContactNumber || restaurant?.ownerPhone || '').trim();
  const hubAddress =
    addressFromSettings ||
    String(restaurant?.location?.formattedAddress || '').trim() ||
    String(restaurant?.location?.address || '').trim() ||
    String(restaurant?.addressLine1 || '').trim();

  return {
    restaurant,
    businessSettings: settings || null,
    pickupHub: {
      name: hubName,
      phone: hubPhone,
      address: hubAddress,
      location:
        coordinates?.length === 2
          ? {
              type: 'Point',
              coordinates,
            }
          : null,
    },
  };
}

