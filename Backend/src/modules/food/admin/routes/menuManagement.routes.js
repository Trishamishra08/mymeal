import express from 'express';
import * as menuManagementController from '../controllers/menuManagement.controller.js';

const router = express.Router();

router.get('/categories', menuManagementController.listMenuCategories);
router.post('/categories', menuManagementController.createMenuCategory);
router.patch('/categories/:id', menuManagementController.updateMenuCategory);
router.patch('/categories/:id/status', menuManagementController.toggleMenuCategoryStatus);
router.delete('/categories/:id', menuManagementController.deleteMenuCategory);

router.get('/items', menuManagementController.listMenuItems);
router.post('/items', menuManagementController.createMenuItem);
router.patch('/items/:id', menuManagementController.updateMenuItem);
router.patch('/items/:id/status', menuManagementController.toggleMenuItemStatus);
router.patch('/items/:id/availability', menuManagementController.toggleMenuItemAvailability);
router.delete('/items/:id', menuManagementController.deleteMenuItem);

router.get('/today', menuManagementController.getDailyMenu);
router.post('/today', menuManagementController.saveDailyMenu);
router.get('/today/duplicate-yesterday', menuManagementController.duplicateYesterdayMenu);
router.delete('/today/:id', menuManagementController.deleteDailyMenu);
router.get('/history', menuManagementController.listDailyMenuHistory);
router.get('/stats', menuManagementController.getMenuStats);

export default router;
