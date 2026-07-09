import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

const addressSchema = z.object({
  label: z.string().optional(),
  name: z.string().optional(),
  fullName: z.string().optional(),
  street: z.string().min(1, 'Street is required'),
  additionalDetails: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  location: z.object({
    type: z.string().optional(),
    coordinates: z.array(z.number()).optional(),
  }).optional(),
}).passthrough();

const createSubscriptionCheckoutSchema = z.object({
  planId: z.string().min(1, 'Plan id is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  deliveryAddress: addressSchema,
});

const verifySubscriptionPaymentSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription id required'),
  razorpayOrderId: z.string().min(1, 'Razorpay order id required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment id required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature required'),
});

const changeAddressSchema = z.object({
  deliveryAddress: addressSchema,
});

const customizeSubscriptionDaySchema = z.object({
  mealSelections: z.record(z.string(), z.string()).default({}),
});

const skipSubscriptionDaySchema = z.object({
  reason: z.string().max(500).optional(),
});

function toValidationError(result) {
  const first = result.error?.issues?.[0];
  const path = first?.path?.length ? first.path.join('.') : '';
  const msg = path ? `${path}: ${first?.message || 'Validation failed'}` : first?.message || 'Validation failed';
  throw new ValidationError(msg);
}

export function validateCreateSubscriptionOrderDto(body) {
  const result = createSubscriptionCheckoutSchema.safeParse(body || {});
  if (!result.success) toValidationError(result);
  return result.data;
}

export function validateVerifySubscriptionPaymentDto(body) {
  const result = verifySubscriptionPaymentSchema.safeParse(body || {});
  if (!result.success) toValidationError(result);
  return result.data;
}

export function validateChangeSubscriptionAddressDto(body) {
  const result = changeAddressSchema.safeParse(body || {});
  if (!result.success) toValidationError(result);
  return result.data;
}

export function validateCustomizeSubscriptionItemsDto(body) {
  const result = customizeSubscriptionDaySchema.safeParse(body || {});
  if (!result.success) toValidationError(result);
  return result.data;
}

export function validateSkipSubscriptionScheduleDto(body) {
  const result = skipSubscriptionDaySchema.safeParse(body || {});
  if (!result.success) toValidationError(result);
  return result.data;
}