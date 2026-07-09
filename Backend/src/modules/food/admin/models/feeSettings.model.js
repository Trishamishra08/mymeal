import mongoose from 'mongoose';

const feeSettingsSchema = new mongoose.Schema(
    {
        // Single Orders
        singleOrderTiffinAmount: { type: Number, min: 0, default: 0 },
        singleOrderGst: { type: Number, min: 0, max: 100, default: 0 },
        singleOrderDeliveryFee: { type: Number, min: 0, default: 0 },

        // Subscriptions
        subscriptionDeliveryFee: { type: Number, min: 0, default: 0 },
        subscriptionGst: { type: Number, min: 0, max: 100, default: 0 },
        subscriptionAddonTiffinCharge: { type: Number, min: 0, default: 0 },

        // Global settings
        globalRestaurantCommission: { type: Number, min: 0, default: 0 },
        globalGstOnItem: { type: Number, min: 0, max: 100, default: 0 },
        globalGstOnCommission: { type: Number, min: 0, max: 100, default: 18 },
        globalPaymentGatewayFee: { type: Number, min: 0, max: 100, default: 2 },
        globalTcs: { type: Number, min: 0, max: 100, default: 1 },
        applyGlobalTaxes: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true, index: true }
    },
    { collection: 'food_fee_settings', timestamps: true }
);

feeSettingsSchema.index({ isActive: 1, createdAt: -1 });

export const FoodFeeSettings = mongoose.model('FoodFeeSettings', feeSettingsSchema);
