'use strict';
const router = require('express').Router();
const { paymentService } = require('./payment.service');
const { ApiResponse } = require('../../utils/response');
const { authenticate, requireUser, requireAdmin } = require('../../middleware/auth');
const { validateBody, validateQuery } = require('../../middleware/validate');
const { withdrawSchema } = require('../../validators/schemas');
const Joi = require('joi');

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Worker: get own wallet
router.get('/wallet', authenticate, requireUser, async (req, res) => {
  const wallet = await paymentService.getWallet(req.user.id);
  ApiResponse.success(res, wallet);
});

// Worker: withdraw
router.post('/wallet/withdraw', authenticate, requireUser, validateBody(withdrawSchema), async (req, res) => {
  const { amount, notes } = req.body;
  const result = await paymentService.withdraw(req.user.id, amount, notes);
  ApiResponse.success(res, result, 'Withdrawal processed');
});

// Worker: earnings history
router.get('/earnings', authenticate, requireUser, validateQuery(paginationSchema), async (req, res) => {
  const result = await paymentService.getEarnings(req.user.id, req.query);
  ApiResponse.paginated(res, result.transactions, result.pagination, 'Earnings history');
});

// Admin: manually trigger payment for a hire (after mark-complete)
router.post('/release', authenticate, requireAdmin, async (req, res) => {
  const { hire_id } = req.body;
  if (!hire_id) throw require('../../utils/AppError').badRequest('hire_id is required');
  const payment = await paymentService.createPendingPayment(hire_id, req.user.id);
  ApiResponse.created(res, payment, 'Payment queued for T+1 settlement');
});

module.exports = router;
