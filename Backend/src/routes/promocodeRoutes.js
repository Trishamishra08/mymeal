import express from 'express';
import {
  createPromocode,
  getRestaurantPromocodes,
  togglePromocodeStatus,
  deletePromocode,
  getActivePromocodes,
  validatePromocode
} from '../controllers/promocodeController.js';
import { authMiddleware } from '../core/auth/auth.middleware.js';
import { requireRoles } from '../core/roles/role.middleware.js';
const router = express.Router();
router.get('/active', getActivePromocodes);
router.post('/validate', validatePromocode);
router.use(authMiddleware, requireRoles('ADMIN'));
router.route('/')
  .get(getRestaurantPromocodes)
  .post(createPromocode);
router.route('/:id')
  .patch(togglePromocodeStatus)
  .delete(deletePromocode);
export default router;