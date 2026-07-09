import mongoose from 'mongoose';
import { ValidationError } from '../../../../core/auth/errors.js';

export async function listPendingFoodApprovals(query = {}) {
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 200, 1), 1000);
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    return { requests: [], page, limit, total: 0 };
}

export async function approveFoodItem(id) {
    throw new ValidationError('Approvals are no longer required. Admin adds food directly.');
}

export async function rejectFoodItem(id, reason) {
    throw new ValidationError('Approvals are no longer required. Admin adds food directly.');
}

export async function bulkApproveFoodItems(ids) {
    return { successCount: 0, errorCount: 0, errors: [] };
}
