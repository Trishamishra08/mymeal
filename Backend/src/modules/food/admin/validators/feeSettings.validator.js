import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

const feeSettingsUpsertSchema = z.object({
    singleOrderTiffinAmount: z.number().min(0).nullable().optional(),
    singleOrderGst: z.number().min(0).max(100).nullable().optional(),
    singleOrderDeliveryFee: z.number().min(0).nullable().optional(),
    subscriptionDeliveryFee: z.number().min(0).nullable().optional(),
    subscriptionGst: z.number().min(0).max(100).nullable().optional(),
    subscriptionAddonTiffinCharge: z.number().min(0).nullable().optional(),
    isActive: z.boolean().optional()
});

export const validateFeeSettingsUpsertDto = (body) => {
    const parseNumber = (val) => val === null ? null : val !== undefined ? Number(val) : undefined;
    
    const normalized = {
        singleOrderTiffinAmount: parseNumber(body?.singleOrderTiffinAmount),
        singleOrderGst: parseNumber(body?.singleOrderGst),
        singleOrderDeliveryFee: parseNumber(body?.singleOrderDeliveryFee),
        subscriptionDeliveryFee: parseNumber(body?.subscriptionDeliveryFee),
        subscriptionGst: parseNumber(body?.subscriptionGst),
        subscriptionAddonTiffinCharge: parseNumber(body?.subscriptionAddonTiffinCharge),
        isActive: body?.isActive !== undefined ? Boolean(body.isActive) : undefined
    };

    const result = feeSettingsUpsertSchema.safeParse(normalized);
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }

    return result.data;
};
