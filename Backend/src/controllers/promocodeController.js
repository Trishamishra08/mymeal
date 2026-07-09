import Promocode from '../models/Promocode.js';
import { sendResponse } from '../utils/response.js';

import { ValidationError } from '../core/auth/errors.js';
import { getSingleKitchenContext } from '../modules/food/shared/singleKitchen.service.js';

const syncKitchenDiscount = async (restaurantId) => {
    try {
        const now = new Date();
        const activePromos = await Promocode.find({
            restaurantId,
            isActive: true,
            expiryDate: { $gt: now }
        });

        let maxDiscount = 0;
        for (const promo of activePromos) {
            if (!promo.usageLimit || promo.usageCount < promo.usageLimit) {
                if (promo.discountType === 'PERCENTAGE' && promo.discountValue > maxDiscount) {
                    maxDiscount = promo.discountValue;
                }
            }
        }

        await FoodRestaurant.findByIdAndUpdate(restaurantId, { discount: maxDiscount });
    } catch (err) {
        console.error('Error syncing kitchen discount:', err);
    }
};

async function getKitchenRestaurantId() {
    const { restaurant } = await getSingleKitchenContext();
    if (!restaurant?._id) {
        throw new ValidationError('Admin kitchen not found');
    }
    return String(restaurant._id);
}

export const createPromocode = async (_req, res, next) => {
  try {
    const restaurantId = await getKitchenRestaurantId();
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, expiryDate, usageLimit } = _req.body;

    if (!code || !description || !discountType || !discountValue || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existingCode = await Promocode.findOne({ restaurantId, code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Promocode with this code already exists for the admin kitchen' });
    }

    const promocode = await Promocode.create({
      restaurantId,
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      expiryDate,
      usageLimit: usageLimit || null,
    });

    await syncKitchenDiscount(restaurantId);

    return sendResponse(res, 201, 'Promocode created successfully', { promocode });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantPromocodes = async (_req, res, next) => {
  try {
    const restaurantId = await getKitchenRestaurantId();
    const promocodes = await Promocode.find({ restaurantId }).sort('-createdAt');

    return sendResponse(res, 200, 'Promocodes fetched successfully', { promocodeList: promocodes });
  } catch (error) {
    next(error);
  }
};

export const togglePromocodeStatus = async (req, res, next) => {
  try {
    const restaurantId = await getKitchenRestaurantId();
    const { id } = req.params;
    const { isActive } = req.body;

    const promocode = await Promocode.findOneAndUpdate(
      { _id: id, restaurantId },
      { isActive },
      { new: true, runValidators: true }
    );

    if (!promocode) {
      return res.status(404).json({ success: false, message: 'Promocode not found' });
    }

    await syncKitchenDiscount(restaurantId);

    return sendResponse(res, 200, 'Promocode status updated', { promocode });
  } catch (error) {
    next(error);
  }
};

export const deletePromocode = async (req, res, next) => {
  try {
    const restaurantId = await getKitchenRestaurantId();
    const { id } = req.params;

    const promocode = await Promocode.findOneAndDelete({ _id: id, restaurantId });

    if (!promocode) {
      return res.status(404).json({ success: false, message: 'Promocode not found' });
    }

    await syncKitchenDiscount(restaurantId);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getActivePromocodes = async (_req, res, next) => {
  try {
    const restaurantId = await getKitchenRestaurantId();

    const promocodes = await Promocode.find({
      restaurantId,
      isActive: true,
      expiryDate: { $gt: new Date() }
    }).sort('-createdAt');

    const validPromocodes = promocodes.filter((p) => !p.usageLimit || p.usageCount < p.usageLimit);

    return sendResponse(res, 200, 'Active promocodes fetched', { promocodeList: validPromocodes });
  } catch (error) {
    next(error);
  }
};

export const validatePromocode = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const restaurantId = req.body?.restaurantId || await getKitchenRestaurantId();

    if (!code || !orderAmount) {
      return res.status(400).json({ success: false, message: 'Please provide code and orderAmount' });
    }

    const promocode = await Promocode.findOne({
      restaurantId,
      code: code.toUpperCase(),
      isActive: true
    });

    if (!promocode) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive promocode' });
    }

    if (new Date(promocode.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'This promocode has expired' });
    }

    if (promocode.usageLimit && promocode.usageCount >= promocode.usageLimit) {
      return res.status(400).json({ success: false, message: 'This promocode has reached its usage limit' });
    }

    if (orderAmount < promocode.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount of Rs.${promocode.minOrderAmount} is required` });
    }

    let discountAmount = 0;
    if (promocode.discountType === 'FLAT') {
      discountAmount = promocode.discountValue;
    } else if (promocode.discountType === 'PERCENTAGE') {
      discountAmount = (orderAmount * promocode.discountValue) / 100;
      if (promocode.maxDiscountAmount && discountAmount > promocode.maxDiscountAmount) {
        discountAmount = promocode.maxDiscountAmount;
      }
    }

    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    return sendResponse(res, 200, 'Promocode applied successfully', {
      promocode,
      discountAmount,
      finalAmount: orderAmount - discountAmount
    });
  } catch (error) {
    next(error);
  }
};
