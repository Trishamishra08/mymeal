import express from 'express';
import { AuthError } from '../../../../core/auth/errors.js';
import * as adminController from '../controllers/admin.controller.js';
import * as foodApprovalController from '../controllers/foodApproval.controller.js';
import * as addonsApprovalController from '../controllers/addonsApproval.controller.js';
import * as businessSettingsController from '../controllers/businessSettings.controller.js';
import * as feedbackExperienceController from '../controllers/feedbackExperience.controller.js';
import * as notificationBroadcastController from '../controllers/notificationBroadcast.controller.js';
import * as diningAdminController from '../../dining/controllers/diningAdmin.controller.js';
import * as orderController from '../../orders/controllers/order.controller.js';
import { getAdminPageController, upsertAdminPageController } from '../controllers/pageContent.controller.js';
import * as liveMonitorController from '../controllers/liveMonitor.controller.js';
import * as appIntroAdController from '../controllers/appIntroAd.controller.js';
import { getAppCustomizationController, sendAppCustomizationTestNotificationController, updateAppCustomizationController } from '../../shared/appCustomization.controller.js';
import * as subscriptionController from '../../subscription/controllers/subscription.controller.js';
import {
    listSubscriptionPlansAdminController,
    createSubscriptionPlanController,
    updateSubscriptionPlanController,
    deleteSubscriptionPlanController,
    toggleSubscriptionPlanStatusController,
    updateSubscriptionPlanOrderController,
} from '../../landing/controllers/subscriptionPlan.controller.js';
import { upload } from '../../../../middleware/upload.js';
import menuBulkRoutes from './menuBulk.routes.js';
import menuManagementRoutes from './menuManagement.routes.js';

const router = express.Router();

router.use('/menu', menuBulkRoutes);

// ----- Public Business Settings (No Admin Required) -----
router.get('/business-settings/public', businessSettingsController.getBusinessSettings);

// ----- Public Fee Settings (No Admin Required) -----
router.get('/fee-settings/public', adminController.getFeeSettings);

const requireAdmin = (req, _res, next) => {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
        return next(new AuthError('Admin access required'));
    }
    return next();
};

router.use(requireAdmin);

// ----- Subscription Plans -----
router.get('/subscription-plans', listSubscriptionPlansAdminController);
router.post('/subscription-plans', createSubscriptionPlanController);
router.patch('/subscription-plans/:id', updateSubscriptionPlanController);
router.delete('/subscription-plans/:id', deleteSubscriptionPlanController);
router.patch('/subscription-plans/:id/status', toggleSubscriptionPlanStatusController);
router.patch('/subscription-plans/:id/order', updateSubscriptionPlanOrderController);


// ----- MyMeal Menu Management -----
router.use('/menu-management', menuManagementRoutes);

// ----- Broadcast Notifications -----
router.post('/notifications/broadcast', notificationBroadcastController.createBroadcastNotificationController);
router.get('/notifications/broadcast', notificationBroadcastController.getBroadcastNotificationsController);
router.delete('/notifications/broadcast/:id', notificationBroadcastController.deleteBroadcastNotificationController);

// ----- Customers -----
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.patch('/customers/:id/status', adminController.updateCustomerStatus);
router.post('/customers/:id/wallet-topup', adminController.topupCustomerWallet);

// ----- Safety / Emergency Reports -----
router.get('/safety-emergency-reports', adminController.getSafetyEmergencyReports);
router.put('/safety-emergency-reports/:id/status', adminController.updateSafetyEmergencyStatus);
router.put('/safety-emergency-reports/:id/priority', adminController.updateSafetyEmergencyPriority);
router.delete('/safety-emergency-reports/:id', adminController.deleteSafetyEmergencyReport);

// ----- Support Tickets (users) -----
router.get('/support-tickets', adminController.getSupportTicketsController);
router.patch('/support-tickets/:id', adminController.updateSupportTicketController);
router.get('/global-search', adminController.globalSearch);

// ----- Restaurants ----- (REMOVED)
// ----- Restaurant Commission ----- (REMOVED)

// ----- Categories -----
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);
router.patch('/categories/:id/toggle', adminController.toggleCategoryStatus);
router.patch('/categories/:id/approve', adminController.approveCategory);
router.patch('/categories/:id/reject', adminController.rejectCategory);
router.patch('/categories/:id/make-global', adminController.makeCategoryGlobal);

// ----- Restaurant Add-ons Approval ----- (REMOVED)

// ----- Foods -----
// Food approval queue (pending items created by restaurants)
router.get('/foods/pending-approvals', foodApprovalController.getPendingFoodApprovals);
router.patch('/foods/bulk-approve', foodApprovalController.bulkApproveFoodItemsController);
router.patch('/foods/:id/approve', foodApprovalController.approveFoodItemController);
router.patch('/foods/:id/reject', foodApprovalController.rejectFoodItemController);

router.get('/foods', adminController.getFoods);
router.post('/foods', adminController.createFood);
router.patch('/foods/:id', adminController.updateFood);
router.delete('/foods/:id', adminController.deleteFood);

// ----- Offers & Coupons -----
router.get('/offers', adminController.getAllOffers);
router.post('/offers', adminController.createAdminOffer);
router.patch('/offers/:id/cart-visibility', adminController.updateAdminOfferCartVisibility);
router.delete('/offers/:id', adminController.deleteAdminOffer);

// ----- Feedback Experience (Admin) -----
router.get('/feedback-experiences', feedbackExperienceController.getFeedbackExperiences);
router.delete('/feedback-experiences/:id', feedbackExperienceController.deleteFeedbackExperience);

// ----- Fee Settings -----
router.get('/fee-settings', adminController.getFeeSettings);
router.put('/fee-settings', adminController.createOrUpdateFeeSettings);

// ----- Referral Settings -----
router.get('/referral-settings', adminController.getReferralSettings);
router.put('/referral-settings', adminController.createOrUpdateReferralSettings);

// ----- Business Settings -----
router.get('/business-settings/public', businessSettingsController.getBusinessSettings); // Public endpoint
router.get('/business-settings', businessSettingsController.getBusinessSettings);
router.patch('/business-settings', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
    { name: 'termsAndConditionsPdf', maxCount: 1 }
]), businessSettingsController.updateBusinessSettings);

// ----- Delivery Cash Limit -----
router.get('/delivery-cash-limit', adminController.getDeliveryCashLimit);
router.patch('/delivery-cash-limit', adminController.updateDeliveryCashLimit);

// ----- Delivery Emergency Help -----
router.get('/delivery-emergency-help', adminController.getEmergencyHelp);
router.put('/delivery-emergency-help', adminController.createOrUpdateEmergencyHelp);

// ----- Withdrawals (admin) -----
router.get('/withdrawals', adminController.getWithdrawals);
router.patch('/withdrawals/:id', adminController.updateWithdrawalStatus);
router.get('/delivery/withdrawals', adminController.getDeliveryWithdrawals);
router.patch('/delivery/withdrawals/:id', adminController.updateDeliveryWithdrawalStatus);
router.get('/delivery/cash-limit-settlements', adminController.getCashLimitSettlements);

// ----- Delivery partners & general -----
router.get('/delivery/join-requests', adminController.getDeliveryJoinRequests);
router.get('/delivery/available-partners', adminController.getAvailableDeliveryPartners);
router.get('/delivery/wallets', adminController.getDeliveryWallets);
router.get('/delivery/bonus-transactions', adminController.getDeliveryPartnerBonusTransactions);
router.get('/delivery/earnings', adminController.getDeliveryEarnings);
router.post('/delivery/bonus', adminController.addDeliveryPartnerBonus);
router.get('/delivery/commission-rules', adminController.getDeliveryCommissionRules);
router.post('/delivery/commission-rules', adminController.createDeliveryCommissionRule);
router.patch('/delivery/commission-rules/:id', adminController.updateDeliveryCommissionRule);
router.delete('/delivery/commission-rules/:id', adminController.deleteDeliveryCommissionRule);
router.patch('/delivery/commission-rules/:id/status', adminController.toggleDeliveryCommissionRuleStatus);
router.get('/delivery/reviews', adminController.getDeliverymanReviews);
router.get('/contact-messages', adminController.getContactMessages);
router.get('/delivery/earning-addons', adminController.getEarningAddons);
router.post('/delivery/earning-addons', adminController.createEarningAddon);
router.patch('/delivery/earning-addons/:id', adminController.updateEarningAddon);
router.delete('/delivery/earning-addons/:id', adminController.deleteEarningAddon);
router.patch('/delivery/earning-addons/:id/status', adminController.toggleEarningAddonStatus);
router.get('/delivery/earning-addon-history', adminController.getEarningAddonHistory);
router.post('/delivery/earning-addon-history/:id/credit', adminController.creditEarningToWallet);
router.post('/delivery/earning-addon-history/:id/cancel', adminController.cancelEarningAddonHistory);
router.post('/delivery/earning-addon-completions/check', adminController.checkEarningAddonCompletions);
router.get('/delivery/support-tickets/stats', adminController.getSupportTicketStats);
router.get('/delivery/support-tickets', adminController.getSupportTickets);
router.patch('/delivery/support-tickets/:id', adminController.updateSupportTicket);
router.get('/delivery/partners', adminController.getDeliveryPartners);
router.get('/delivery/:id', adminController.getDeliveryPartnerById);
router.patch('/delivery/:id/approve', adminController.approveDeliveryPartner);
router.patch('/delivery/:id/reject', adminController.rejectDeliveryPartner);
router.patch('/delivery/:id/availability', adminController.updateDeliveryPartnerAvailabilityAdmin);
router.delete('/delivery/:id', adminController.deleteDeliveryPartner);

// ----- Zones -----
router.get('/zones', adminController.getZones);
router.get('/zones/:id', adminController.getZoneById);
router.post('/zones', adminController.createZone);
router.patch('/zones/:id', adminController.updateZone);
router.delete('/zones/:id', adminController.deleteZone);

// ----- Dining -----
router.get('/dining/categories', diningAdminController.getDiningCategories);
router.post('/dining/categories', diningAdminController.createDiningCategory);
router.patch('/dining/categories/:id', diningAdminController.updateDiningCategory);
router.delete('/dining/categories/:id', diningAdminController.deleteDiningCategory);
router.get('/dining/restaurants', diningAdminController.getDiningRestaurants);
router.patch('/dining/restaurants/:restaurantId', diningAdminController.updateDiningRestaurant);
router.get('/dining/requests', diningAdminController.listAllDiningRequests);
router.patch('/dining/requests/:id/approve', diningAdminController.approveDiningRequest);
router.patch('/dining/requests/:id/reject', diningAdminController.rejectDiningRequest);

// ----- Orders -----
router.get('/orders', orderController.listOrdersAdminController);
router.get('/orders/:orderId', orderController.getOrderByIdAdminController);
router.delete('/orders/:orderId', orderController.deleteOrderAdminController);
router.patch('/orders/:orderId/status', orderController.updateOrderStatusAdminController);
router.post('/orders/:orderId/assign-delivery', orderController.assignDeliveryPartnerController);

// ----- Subscriptions -----
router.get('/subscriptions', subscriptionController.listSubscriptionsAdminController);
router.get('/subscriptions/schedules/today', subscriptionController.listTodaySubscriptionMealsAdminController);
router.post('/subscriptions/schedules/:scheduleId/send-to-delivery', subscriptionController.sendSubscriptionMealToDeliveryAdminController);
router.get('/subscriptions/:subscriptionId', subscriptionController.getSubscriptionAdminController);

// ----- App Customization -----
router.get('/app-customization', getAppCustomizationController);
router.put('/app-customization', updateAppCustomizationController);
router.post('/app-customization/test-notification', sendAppCustomizationTestNotificationController);

// ----- CMS Pages (About + legal) -----
router.get('/pages-social-media/:key', getAdminPageController);
router.put('/pages-social-media/:key', upsertAdminPageController);

router.get('/sidebar-badges', adminController.getSidebarBadges);
router.get('/notifications/fssai-expired', adminController.getExpiredFssaiNotifications);

// ----- Live Monitor -----
router.get('/live-monitor/status', liveMonitorController.getLiveMonitorStatus);

// ----- App Intro & Ads -----
router.get('/app-intro-ads', appIntroAdController.getAppIntroAds);
router.post('/app-intro-ads', upload.fields([{ name: 'media', maxCount: 1 }]), appIntroAdController.createAppIntroAd);
router.patch('/app-intro-ads/order', appIntroAdController.updateAppIntroAdsOrder);
router.patch('/app-intro-ads/:id', upload.fields([{ name: 'media', maxCount: 1 }]), appIntroAdController.updateAppIntroAd);
router.patch('/app-intro-ads/:id/toggle', appIntroAdController.toggleAppIntroAdStatus);
router.delete('/app-intro-ads/:id', appIntroAdController.deleteAppIntroAd);

export default router;



