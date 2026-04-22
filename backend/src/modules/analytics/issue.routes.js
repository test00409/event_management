'use strict';
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Issue, Hire, Application, EventRole, User, Event } = require('../../database/models');
const { APPLICATION_STATUS, ROLES } = require('../../utils/constants');
const AppError = require('../../utils/AppError');
const { ApiResponse } = require('../../utils/response');
const { authenticate, requireAdminOnly } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const { replaceWorkerSchema } = require('../../validators/schemas');

router.post('/replace-worker', authenticate, requireAdminOnly, validateBody(replaceWorkerSchema), async (req, res) => {
  const { original_hire_id, replacement_application_id, issue_type, description } = req.body;

  // Validate original hire belongs to this admin
  const originalHire = await Hire.findByPk(original_hire_id);
  if (!originalHire) throw AppError.notFound('Original hire not found');
  if (originalHire.admin_id !== req.user.id) throw AppError.forbidden('Access denied');

  // Validate replacement application
  const replApp = await Application.findByPk(replacement_application_id, {
    include: [{ model: EventRole, as: 'role' }],
  });
  if (!replApp) throw AppError.notFound('Replacement application not found');
  if (replApp.admin_id !== req.user.id) throw AppError.forbidden('Access denied');
  if (replApp.event_id !== originalHire.event_id) throw AppError.badRequest('Replacement must be for the same event');
  if (replApp.status !== APPLICATION_STATUS.PENDING) throw AppError.badRequest('Replacement application must be PENDING');

  // Create issue log
  const issue = await Issue.create({
    id: uuidv4(),
    event_id: originalHire.event_id,
    admin_id: req.user.id,
    reported_user_id: originalHire.user_id,
    original_hire_id,
    issue_type,
    description,
  });

  // Accept replacement application → create new hire
  const newHire = await Hire.create({
    id: uuidv4(),
    application_id: replacement_application_id,
    event_id: originalHire.event_id,
    event_role_id: originalHire.event_role_id,
    user_id: replApp.user_id,
    admin_id: req.user.id,
    agreed_pay: replApp.role.pay_per_slot,
    is_replacement: true,
    replaced_hire_id: original_hire_id,
  });

  await replApp.update({ status: APPLICATION_STATUS.ACCEPTED, reviewed_at: new Date() });
  await issue.update({ replacement_hire_id: newHire.id, resolved: true, resolved_at: new Date() });

  ApiResponse.success(res, { issue, new_hire: newHire }, 'Worker replaced successfully');
});

// Get issues for an event (admin)
router.get('/event/:eventId', authenticate, requireAdminOnly, async (req, res) => {
  const event = await Event.findByPk(req.params.eventId);
  if (!event) throw AppError.notFound('Event not found');
  if (event.admin_id !== req.user.id) throw AppError.forbidden('Access denied');

  const issues = await Issue.findAll({
    where: { event_id: req.params.eventId },
    include: [{ model: User, as: 'reportedWorker', foreignKey: 'reported_user_id', attributes: ['id', 'name', 'phone'] }],
    order: [['created_at', 'DESC']],
  });
  ApiResponse.success(res, issues);
});

module.exports = router;
