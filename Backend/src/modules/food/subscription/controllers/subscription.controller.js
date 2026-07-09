import { sendResponse } from '../../../../utils/response.js';
import {
  validateCreateSubscriptionOrderDto,
  validateVerifySubscriptionPaymentDto,
  validateChangeSubscriptionAddressDto,
  validateCustomizeSubscriptionItemsDto,
  validateSkipSubscriptionScheduleDto,
} from '../validators/subscription.validator.js';
import * as subscriptionService from '../services/subscription.service.js';

export async function createSubscriptionOrderController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const dto = validateCreateSubscriptionOrderDto(req.body);
    const result = await subscriptionService.createSubscriptionOrder(userId, dto);
    return sendResponse(res, 201, 'Subscription checkout created', result);
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

export async function getCurrentSubscriptionController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const result = await subscriptionService.getCurrentSubscriptionForUser(userId);
    return sendResponse(res, 200, 'Current subscription retrieved', result);
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

export async function listUpcomingSubscriptionSchedulesController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const result = await subscriptionService.listUpcomingSchedulesForUser(userId);
    return sendResponse(res, 200, 'Upcoming subscription days retrieved', result);
  } catch (err) {
    next(err);
  }
}

export async function changeSubscriptionAddressController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const dto = validateChangeSubscriptionAddressDto(req.body);
    const result = await subscriptionService.changeSubscriptionAddress(userId, req.params.subscriptionId, dto);
    return sendResponse(res, 200, 'Subscription address updated', result);
  } catch (err) {
    next(err);
  }
}

export async function customizeSubscriptionItemsController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const dto = validateCustomizeSubscriptionItemsDto(req.body);
    const result = await subscriptionService.customizeSubscriptionItems(userId, req.params.scheduleId, dto);
    return sendResponse(res, 200, 'Subscription day customized', result);
  } catch (err) {
    next(err);
  }
}

export async function skipSubscriptionScheduleController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const dto = validateSkipSubscriptionScheduleDto(req.body);
    const result = await subscriptionService.skipSubscriptionSchedule(userId, req.params.scheduleId, dto);
    return sendResponse(res, 200, 'Subscription day skipped', result);
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

export async function listTodaySubscriptionMealsAdminController(req, res, next) {
  try {
    const result = await subscriptionService.listTodaySubscriptionMealsAdmin(req.query || {});
    return sendResponse(res, 200, 'Today subscription deliveries retrieved', result);
  } catch (err) {
    next(err);
  }
}

export async function sendSubscriptionMealToDeliveryAdminController(req, res, next) {
  try {
    const result = await subscriptionService.sendSubscriptionMealToDeliveryAdmin(req.params.scheduleId);
    return sendResponse(res, 200, 'Subscription day marked ready for assignment', result);
  } catch (err) {
    next(err);
  }
}

export async function updateSubscriptionScheduleStatusAdminController(req, res, next) {
  try {
    const { status } = req.body;
    const result = await subscriptionService.updateSubscriptionScheduleStatusAdmin(req.params.scheduleId, status);
    return sendResponse(res, 200, 'Subscription schedule status updated', result);
  } catch (err) {
    next(err);
  }
}