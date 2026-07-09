import express from 'express';
import {
  createSubscriptionOrderController,
  verifySubscriptionPaymentController,
  getCurrentSubscriptionController,
  listMySubscriptionsController,
  listUpcomingSubscriptionSchedulesController,
  changeSubscriptionAddressController,
  customizeSubscriptionItemsController,
  skipSubscriptionScheduleController,
} from '../controllers/subscription.controller.js';

const router = express.Router();

router.get('/me', getCurrentSubscriptionController);
router.get('/my', listMySubscriptionsController);
router.get('/history', listMySubscriptionsController);
router.get('/schedules/upcoming', listUpcomingSubscriptionSchedulesController);
router.get('/days/upcoming', listUpcomingSubscriptionSchedulesController);
router.post('/checkout', createSubscriptionOrderController);
router.post('/create-order', createSubscriptionOrderController);
router.post('/verify-payment', verifySubscriptionPaymentController);
router.patch('/:subscriptionId/address', changeSubscriptionAddressController);
router.patch('/schedules/:scheduleId/customize-items', customizeSubscriptionItemsController);
router.post('/schedules/:scheduleId/skip', skipSubscriptionScheduleController);
router.patch('/days/:scheduleId/customize', customizeSubscriptionItemsController);
router.patch('/days/:scheduleId/skip', skipSubscriptionScheduleController);

export default router;
