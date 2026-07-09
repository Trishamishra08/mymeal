import express from 'express';
import {
    getPaymentHistoryController,
    getOrderTransactionsController,
    getUserWalletBalanceController,
    getUserWalletTransactionsController,
    getDeliveryWalletController,
    getAdminWalletController,
    getAdminFinanceSummaryController,
    listSettlementsController,
    createSettlementController,
    processSettlementController,
    listRefundsController,
    getRefundsByOrderController
} from './payment.controller.js';

const router = express.Router();

router.get('/orders/:orderId/payments', getPaymentHistoryController);
router.get('/orders/:orderId/transactions', getOrderTransactionsController);
router.get('/orders/:orderId/refunds', getRefundsByOrderController);

router.get('/wallet/balance', getUserWalletBalanceController);
router.get('/wallet/transactions', getUserWalletTransactionsController);

router.get('/delivery/:deliveryPartnerId/wallet', getDeliveryWalletController);

router.get('/admin/wallet', getAdminWalletController);
router.get('/admin/finance/summary', getAdminFinanceSummaryController);
router.get('/admin/settlements', listSettlementsController);
router.post('/admin/settlements', createSettlementController);
router.post('/admin/settlements/:id/process', processSettlementController);
router.get('/admin/refunds', listRefundsController);

export default router;