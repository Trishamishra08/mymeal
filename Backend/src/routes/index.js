import express from 'express';
import authRoutes from '../core/auth/auth.routes.js';
import deliveryRoutes from '../modules/food/delivery/routes/delivery.routes.js';
import landingRoutes from '../modules/food/landing/routes/landing.routes.js';
import subscriptionUserRoutes from '../modules/food/subscription/routes/subscription.routes.user.js';
import { getPublicDiningCategories, getPublicDiningRestaurants, getPublicRestaurantOccupiedSeats } from '../modules/food/dining/controllers/diningPublic.controller.js';
import { createBooking, getMyBookings, createReview, getRestaurantBookings, updateBookingStatus } from '../modules/food/dining/controllers/diningBooking.controller.js';
import uploadRoutes from '../modules/uploads/routes/upload.routes.js';
import restaurantAdminRoutes from '../modules/food/admin/routes/admin.routes.js';
import userRoutes from '../modules/food/user/routes/user.routes.js';
import orderUserRoutes from '../modules/food/orders/routes/order.routes.user.js';
import { getOneTimeTiffinMenuController } from '../modules/food/orders/controllers/order.controller.js';
import paymentRoutes from '../core/payments/payment.routes.js';
import fcmRoutes from '../core/notifications/fcm.routes.js';
import notificationRoutes from '../core/notifications/notification.routes.js';
import { authMiddleware } from '../core/auth/auth.middleware.js';
import * as businessSettingsController from '../modules/food/admin/controllers/businessSettings.controller.js';
import { requireRoles } from '../core/roles/role.middleware.js';
import { getQueuesController } from '../controllers/admin.controller.js';
import webhookRoutes from '../core/payments/routes/webhook.routes.js';
import searchRoutes from '../modules/food/search/routes/search.routes.js';
import appConfigRoutes from '../core/appConfig/appConfig.routes.js';
import promocodeRoutes from './promocodeRoutes.js';
import { requireZone } from '../middlewares/zone.middleware.js';
import envSettingRoutes from './admin/envSettingRoutes.js';
import { listPublicMenuCategories } from '../modules/food/admin/controllers/menuManagement.controller.js';
import {
    listSubscriptionPlansPublicController,
    createSubscriptionPlanController,
    updateSubscriptionPlanController,
    deleteSubscriptionPlanController,
    toggleSubscriptionPlanStatusController,
    updateSubscriptionPlanOrderController,
} from '../modules/food/landing/controllers/subscriptionPlan.controller.js';

const router = express.Router();

// Apply Global Zone Interceptor (Reads X-Zone-Id from Frontend Axios)
router.use(requireZone);

router.get('/v1/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

// App Config Route
router.use('/v1/app-config', appConfigRoutes);

// Food-prefixed auth routes
router.use('/v1/food/auth', authRoutes);

// Backward-compatible auth routes
router.use('/v1/auth', authRoutes);
router.use('/v1/food/delivery', deliveryRoutes);
router.use('/v1/food', landingRoutes);
router.use('/v1/food/search', searchRoutes);
router.use('/v1/food/subscriptions', authMiddleware, requireRoles('USER'), subscriptionUserRoutes);
router.use('/v1/food/promocodes', promocodeRoutes);
router.get('/v1/food/subscription-plans', listSubscriptionPlansPublicController);
router.post('/v1/food/subscription-plans', authMiddleware, requireRoles('ADMIN', 'SUPER_ADMIN'), createSubscriptionPlanController);
router.patch('/v1/food/subscription-plans/:id', authMiddleware, requireRoles('ADMIN', 'SUPER_ADMIN'), updateSubscriptionPlanController);
router.delete('/v1/food/subscription-plans/:id', authMiddleware, requireRoles('ADMIN', 'SUPER_ADMIN'), deleteSubscriptionPlanController);
router.patch('/v1/food/subscription-plans/:id/status', authMiddleware, requireRoles('ADMIN', 'SUPER_ADMIN'), toggleSubscriptionPlanStatusController);
router.patch('/v1/food/subscription-plans/:id/order', authMiddleware, requireRoles('ADMIN', 'SUPER_ADMIN'), updateSubscriptionPlanOrderController);
router.get('/v1/food/dining/categories/public', getPublicDiningCategories);
router.get('/v1/food/menu-management/categories/public', listPublicMenuCategories);
router.get('/v1/food/orders/one-time-tiffin/menu/public', getOneTimeTiffinMenuController);
router.get('/v1/food/dining/restaurants/public', getPublicDiningRestaurants);
router.get('/v1/food/dining/restaurants/:restaurantId/occupied-seats/public', getPublicRestaurantOccupiedSeats);

// Dining Booking Routes
router.post('/v1/food/dining/bookings', authMiddleware, requireRoles('USER'), createBooking);
router.get('/v1/food/dining/bookings/my', authMiddleware, requireRoles('USER'), getMyBookings);
router.post('/v1/food/dining/bookings/:bookingId/review', authMiddleware, requireRoles('USER'), createReview);
router.get('/v1/food/dining/bookings/restaurant/:restaurantId', authMiddleware, requireRoles('ADMIN'), getRestaurantBookings);
router.patch('/v1/food/dining/bookings/:bookingId/status', authMiddleware, requireRoles('ADMIN'), updateBookingStatus);

router.use('/v1/uploads', uploadRoutes);

// Mark business-settings/public as truly public
router.get('/v1/food/admin/business-settings/public', businessSettingsController.getBusinessSettings);

router.use('/v1/food/admin/env', envSettingRoutes);
router.use('/v1/food/admin', authMiddleware, requireRoles('ADMIN'), restaurantAdminRoutes);
router.use('/v1/food/user', authMiddleware, requireRoles('USER'), userRoutes);
router.use('/v1/food/notifications', authMiddleware, requireRoles('USER', 'DELIVERY_PARTNER', 'ADMIN'), notificationRoutes);
router.use('/v1/food/orders', authMiddleware, requireRoles('USER'), orderUserRoutes);
router.use('/v1/food/payments', authMiddleware, paymentRoutes);
router.use('/v1/payments/webhook', webhookRoutes);
router.use('/v1/fcm-tokens', fcmRoutes);
router.use('/fcm-tokens', fcmRoutes);

router.get('/v1/admin/queues', authMiddleware, requireRoles('ADMIN'), getQueuesController);

export default router;



