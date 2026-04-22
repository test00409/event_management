'use strict';
const router = require('express').Router();
const applicationService = require('./application.service');
const { ApiResponse } = require('../../utils/response');
const { authenticate, requireAdmin, requireUser } = require('../../middleware/auth');
const { validateBody, validateQuery } = require('../../middleware/validate');
const { applySchema, updateApplicationStatusSchema } = require('../../validators/schemas');
const Joi = require('joi');

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().optional(),
});

// Worker: apply
router.post('/', authenticate, requireUser, validateBody(applySchema), async (req, res) => {
  const app = await applicationService.apply(req.user.id, req.body);
  ApiResponse.created(res, app, 'Application submitted successfully');
});

// Worker: view own applications
router.get('/my', authenticate, requireUser, validateQuery(paginationSchema), async (req, res) => {
  const result = await applicationService.myApplications(req.user.id, req.query);
  ApiResponse.paginated(res, result.applications, result.pagination);
});

// Admin: update status (accept/reject)
router.patch('/:id/status', authenticate, requireAdmin, validateBody(updateApplicationStatusSchema), async (req, res) => {
  const { status, admin_notes } = req.body;
  const app = await applicationService.updateStatus(req.params.id, req.user.id, req.user.role, status, admin_notes);
  ApiResponse.success(res, app, `Application ${status.toLowerCase()}`);
});

// Any authenticated party with access: get one application
router.get('/:id', authenticate, async (req, res) => {
  const app = await applicationService.getOne(req.params.id, req.user.id, req.user.role);
  ApiResponse.success(res, app);
});

module.exports = router;
