import { sendResponse } from '../../../../utils/response.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import {
  validateChangeSubscriptionAddressDto,
  validateChangeSubscriptionDishDto,
  validateCreateSubscriptionOrderDto,
  validateVerifyDishChangePaymentDto,
  validateVerifySubscriptionPaymentDto,
  validateCustomizeSubscriptionItemsDto,
} from '../validators/subscription.validator.js';
import * as subscriptionService from '../services/subscription.service.js';

export async function createSubscriptionOrderController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const dto = validateCreateSubscriptionOrderDto(req.body);
    const result = await subscriptionService.createSubscriptionOrder(userId, dto);
    return sendResponse(res, 201, 'Subscription payment order created', result);
  } catch (err) {
    next(err);
  }
}

export async function verifySubscriptionPaymentController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const dto = validateVerifySubscriptionPaymentDto(req.body);
    const result = await subscriptionService.verifySubscriptionPayment(userId, dto);
    return sendResponse(res, 200, 'Subscription activated', result);
  } catch (err) {
    next(err);
  }
}

export async function listMySubscriptionsController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const result = await subscriptionService.listSubscriptionsForUser(userId);
    return sendResponse(res, 200, 'Subscriptions retrieved', result);
  } catch (err) {
    next(err);
  }
}

export async function listSubscriptionsAdminController(req, res, next) {
  try {
    const result = await subscriptionService.listSubscriptionsAdmin(req.query || {});
    return sendResponse(res, 200, 'Subscriptions retrieved', result);
  } catch (err) {
    next(err);
  }
}

export async function getSubscriptionAdminController(req, res, next) {
  try {
    const result = await subscriptionService.getSubscriptionAdmin(req.params.subscriptionId);
    return sendResponse(res, 200, 'Subscription retrieved', result);
  } catch (err) {
    next(err);
  }
}

export async function listUpcomingSubscriptionSchedulesController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const result = await subscriptionService.listUpcomingSchedulesForUser(userId);
    return sendResponse(res, 200, 'Upcoming subscription meals retrieved', result);
  } catch (err) {
    next(err);
  }
}

export async function changeSubscriptionDishController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const dto = validateChangeSubscriptionDishDto(req.body);
    const result = await subscriptionService.changeSubscriptionScheduleDish(
      userId,
      req.params.scheduleId,
      dto,
    );
    return sendResponse(res, 200, 'Subscription dish change processed', result);
  } catch (err) {
    next(err);
  }
}

export async function customizeSubscriptionItemsController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const dto = validateCustomizeSubscriptionItemsDto(req.body);
    const result = await subscriptionService.customizeSubscriptionItems(
      userId,
      req.params.scheduleId,
      dto,
    );
    return sendResponse(res, 200, 'Subscription items customized successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function changeSubscriptionAddressController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const dto = validateChangeSubscriptionAddressDto(req.body);
    const result = await subscriptionService.changeSubscriptionAddress(
      userId,
      req.params.subscriptionId,
      dto,
    );
    return sendResponse(res, 200, 'Subscription address updated', result);
  } catch (err) {
    next(err);
  }
}

export async function verifyDishChangePaymentController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const dto = validateVerifyDishChangePaymentDto(req.body);
    const result = await subscriptionService.verifySubscriptionDishChangePayment(
      userId,
      req.params.scheduleId,
      dto,
    );
    return sendResponse(res, 200, 'Subscription dish change payment verified', result);
  } catch (err) {
    next(err);
  }
}

export async function skipSubscriptionScheduleController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const result = await subscriptionService.skipSubscriptionSchedule(
      userId,
      req.params.scheduleId,
    );
    return sendResponse(res, 200, 'Subscription meal skipped successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function addExtraTiffinController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const dto = { dishId: req.body?.dishId };
    if (!dto.dishId) throw new ValidationError('Dish ID is required for add-on');
    const result = await subscriptionService.addExtraTiffin(
      userId,
      req.params.scheduleId,
      dto,
    );
    return sendResponse(res, 200, 'Extra tiffin payment initialized', result);
  } catch (err) {
    next(err);
  }
}

export async function verifyExtraTiffinPaymentController(req, res, next) {
  try {
    const userId = req.user?.userId;
    // We can reuse the dish change verification DTO since it expects razorpayOrderId, paymentId, signature
    const dto = validateVerifyDishChangePaymentDto(req.body);
    dto.dishId = req.body?.dishId;
    if (!dto.dishId) throw new ValidationError('Dish ID is required for add-on');
    const result = await subscriptionService.verifyExtraTiffinPayment(
      userId,
      req.params.scheduleId,
      dto,
    );
    return sendResponse(res, 200, 'Extra tiffin added successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function listTodaySubscriptionMealsRestaurantController(req, res, next) {
  try {
    const restaurantId = req.user?.userId;
    const result = await subscriptionService.listTodaySubscriptionMealsForRestaurant(
      restaurantId,
      req.query || {},
    );
    return sendResponse(res, 200, 'Subscription meals retrieved', result);
  } catch (err) {
    next(err);
  }
}

export async function listTodaySubscriptionMealsAdminController(req, res, next) {
  try {
    const result = await subscriptionService.listTodaySubscriptionMealsAdmin(
      req.query || {},
    );
    return sendResponse(res, 200, 'Subscription meals retrieved', result);
  } catch (err) {
    next(err);
  }
}

export async function sendSubscriptionMealToDeliveryController(req, res, next) {
  try {
    const restaurantId = req.user?.userId;
    const result = await subscriptionService.sendSubscriptionMealToDelivery(
      req.params.scheduleId,
      restaurantId,
    );
    return sendResponse(res, 200, 'Subscription meal sent to delivery', result);
  } catch (err) {
    next(err);
  }
}

export async function sendSubscriptionMealToDeliveryAdminController(req, res, next) {
  try {
    const result = await subscriptionService.sendSubscriptionMealToDeliveryAdmin(
      req.params.scheduleId
    );
    return sendResponse(res, 200, 'Subscription meal sent to delivery', result);
  } catch (err) {
    next(err);
  }
}

export async function resendSubscriptionMealToDeliveryController(req, res, next) {
  try {
    const restaurantId = req.user?.userId;
    const result = await subscriptionService.resendSubscriptionMealToDelivery(
      req.params.subscriptionId,
      restaurantId,
    );
    return sendResponse(res, 200, 'Subscription meal sent to delivery', result);
  } catch (err) {
    next(err);
  }
}

export async function cancelSubscriptionForRestaurantController(req, res, next) {
  try {
    const restaurantId = req.user?.userId;
    const result = await subscriptionService.cancelSubscriptionForRestaurant(
      req.params.subscriptionId,
      restaurantId,
      req.body?.reason || '',
    );
    return sendResponse(res, 200, 'Subscription cancelled', result);
  } catch (err) {
    next(err);
  }
}

export async function cancelAddOnTiffinController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const result = await subscriptionService.cancelAddOnTiffin(
      userId,
      req.params.scheduleId,
      req.params.addOnId,
    );
    return sendResponse(res, 200, 'Add-on tiffin cancelled and refunded successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function customizeAddOnTiffinController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const result = await subscriptionService.customizeAddOnTiffin(
      userId,
      req.params.scheduleId,
      req.params.addOnId,
      req.body?.selections || {},
    );
    return sendResponse(res, 200, 'Add-on tiffin customized successfully', result);
  } catch (err) {
    next(err);
  }
}
