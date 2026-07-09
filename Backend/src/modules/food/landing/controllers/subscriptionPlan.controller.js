import { sendResponse } from '../../../../utils/response.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  listSubscriptionPlans,
  toggleSubscriptionPlanStatus,
  updateSubscriptionPlan,
  updateSubscriptionPlanOrder,
} from '../services/subscriptionPlan.service.js';

function toItem(plan) {
  if (!plan) return plan;
  return {
    ...plan,
    order: plan.displayOrder,
  };
}

export async function listSubscriptionPlansAdminController(req, res, next) {
  try {
    const plans = await listSubscriptionPlans({
      search: req.query?.search,
      status: req.query?.status,
    });
    return sendResponse(res, 200, 'Subscription plans fetched successfully', { plans: plans.map(toItem) });
  } catch (error) {
    next(error);
  }
}

export async function listSubscriptionPlansPublicController(_req, res, next) {
  try {
    const plans = await listSubscriptionPlans({ publicOnly: true });
    return sendResponse(res, 200, 'Subscription plans fetched successfully', { plans: plans.map(toItem) });
  } catch (error) {
    next(error);
  }
}

export async function createSubscriptionPlanController(req, res, next) {
  try {
    const created = await createSubscriptionPlan(req.body || {});
    return sendResponse(res, 201, 'Subscription plan created successfully', { plan: toItem(created) });
  } catch (error) {
    next(error);
  }
}

export async function updateSubscriptionPlanController(req, res, next) {
  try {
    if (!req.params.id) throw new ValidationError('Subscription plan id is required');
    const updated = await updateSubscriptionPlan(req.params.id, req.body || {});
    if (!updated) return sendResponse(res, 404, 'Subscription plan not found', null);
    return sendResponse(res, 200, 'Subscription plan updated successfully', { plan: toItem(updated) });
  } catch (error) {
    next(error);
  }
}

export async function deleteSubscriptionPlanController(req, res, next) {
  try {
    if (!req.params.id) throw new ValidationError('Subscription plan id is required');
    const result = await deleteSubscriptionPlan(req.params.id);
    return sendResponse(res, 200, result.deleted ? 'Subscription plan deleted' : 'Subscription plan not found', result);
  } catch (error) {
    next(error);
  }
}

export async function toggleSubscriptionPlanStatusController(req, res, next) {
  try {
    if (!req.params.id) throw new ValidationError('Subscription plan id is required');
    const updated = await toggleSubscriptionPlanStatus(req.params.id);
    if (!updated) return sendResponse(res, 404, 'Subscription plan not found', null);
    return sendResponse(res, 200, 'Subscription plan status updated', { plan: toItem(updated) });
  } catch (error) {
    next(error);
  }
}

export async function updateSubscriptionPlanOrderController(req, res, next) {
  try {
    if (!req.params.id) throw new ValidationError('Subscription plan id is required');
    const displayOrder = req.body?.displayOrder ?? req.body?.order;
    if (displayOrder === undefined) throw new ValidationError('displayOrder is required');
    const updated = await updateSubscriptionPlanOrder(req.params.id, displayOrder);
    if (!updated) return sendResponse(res, 404, 'Subscription plan not found', null);
    return sendResponse(res, 200, 'Subscription plan order updated', { plan: toItem(updated) });
  } catch (error) {
    next(error);
  }
}