import express from 'express';
import {
  changeSubscriptionAddressController,
  changeSubscriptionDishController,
  createSubscriptionOrderController,
  listUpcomingSubscriptionSchedulesController,
  listMySubscriptionsController,
  verifyDishChangePaymentController,
  verifySubscriptionPaymentController,
  skipSubscriptionScheduleController,
  addExtraTiffinController,
  verifyExtraTiffinPaymentController,
  customizeSubscriptionItemsController,
  cancelAddOnTiffinController,
  customizeAddOnTiffinController,
} from '../controllers/subscription.controller.js';

const router = express.Router();

router.get('/my', listMySubscriptionsController);
router.get('/schedules/upcoming', listUpcomingSubscriptionSchedulesController);
router.post('/create-order', createSubscriptionOrderController);
router.post('/verify-payment', verifySubscriptionPaymentController);
router.patch('/:subscriptionId/address', changeSubscriptionAddressController);
router.post('/schedules/:scheduleId/change-dish', changeSubscriptionDishController);
router.post('/schedules/:scheduleId/change-dish/verify-payment', verifyDishChangePaymentController);
router.post('/schedules/:scheduleId/skip', skipSubscriptionScheduleController);
router.post('/schedules/:scheduleId/add-on', addExtraTiffinController);
router.post('/schedules/:scheduleId/add-on/verify-payment', verifyExtraTiffinPaymentController);
router.post('/schedules/:scheduleId/customize-items', customizeSubscriptionItemsController);
router.delete('/schedules/:scheduleId/add-ons/:addOnId', cancelAddOnTiffinController);
router.put('/schedules/:scheduleId/add-ons/:addOnId/customize', customizeAddOnTiffinController);

export default router;
