'use strict';
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { User, Admin, Event, Payment, Application } = require('../../database/models');
const { VERIFICATION_STATUS, ROLES } = require('../../utils/constants');
const AppError = require('../../utils/AppError');
const { ApiResponse, getPagination, getPaginationMeta } = require('../../utils/response');
const { authenticate, requireSuperAdmin } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const { verifyAdminSchema, blockUserSchema } = require('../../validators/schemas');

// All routes require SUPER_ADMIN
router.use(authenticate, requireSuperAdmin);

// List all admins
router.get('/admins', async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { count, rows } = await Admin.findAndCountAll({
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'is_active', 'is_blocked', 'last_login', 'created_at'] }],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
  ApiResponse.paginated(res, rows, getPaginationMeta(count, page, limit));
});

// Verify / reject an admin
router.patch('/admin/:id/verify', validateBody(verifyAdminSchema), async (req, res) => {
  const { action, notes } = req.body;

  const adminProfile = await Admin.findByPk(req.params.id, {
    include: [{ model: User, as: 'user' }],
  });
  if (!adminProfile) throw AppError.notFound('Admin profile not found');
  if (adminProfile.verification_status !== VERIFICATION_STATUS.PENDING) {
    throw AppError.badRequest(`Admin is already ${adminProfile.verification_status}`);
  }

  const updates = {
    verification_status: action,
    verification_notes: notes || null,
    verified_by: req.user.id,
    is_verified: action === VERIFICATION_STATUS.APPROVED,
    ...(action === VERIFICATION_STATUS.APPROVED ? { verified_at: new Date() } : {}),
  };

  await adminProfile.update(updates);

  // Add notification for admin
  const { Notification } = require('../../database/models');
  await Notification.create({
    id: uuidv4(),
    user_id: adminProfile.user_id,
    type: 'VERIFICATION_UPDATE',
    title: action === 'APPROVED' ? 'Account Verified!' : 'Verification Update',
    body: action === 'APPROVED'
      ? 'Your admin account has been verified. You can now create events.'
      : `Your verification was not approved. ${notes || ''}`,
    data: { verification_status: action },
  });

  ApiResponse.success(res, adminProfile, `Admin ${action.toLowerCase()} successfully`);
});

// List all users (workers)
router.get('/users', async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { count, rows } = await User.findAndCountAll({
    where: { role: ROLES.USER },
    attributes: { exclude: ['fcm_token'] },
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
  ApiResponse.paginated(res, rows, getPaginationMeta(count, page, limit));
});

// List all events
router.get('/events', async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const where = {};
  if (req.query.status) where.status = req.query.status;

  const { count, rows } = await Event.findAndCountAll({
    where,
    include: [{ model: User, as: 'organizer', attributes: ['id', 'name', 'phone'] }],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
  ApiResponse.paginated(res, rows, getPaginationMeta(count, page, limit));
});

// List all payments
router.get('/payments', async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { count, rows } = await Payment.findAndCountAll({
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
  ApiResponse.paginated(res, rows, getPaginationMeta(count, page, limit));
});

// Block / unblock user or admin
router.patch('/block-user', validateBody(blockUserSchema), async (req, res) => {
  const { user_id, block, reason } = req.body;
  const user = await User.findByPk(user_id);
  if (!user) throw AppError.notFound('User not found');
  if (user.role === ROLES.SUPER_ADMIN) throw AppError.forbidden('Cannot block a Super Admin');

  await user.update({ is_blocked: block, block_reason: block ? (reason || 'Blocked by Super Admin') : null });
  ApiResponse.success(res, null, `User ${block ? 'blocked' : 'unblocked'} successfully`);
});

// Platform-wide analytics
router.get('/analytics', async (req, res) => {
  const [totalUsers, totalAdmins, totalEvents, totalPaymentsResult] = await Promise.all([
    User.count({ where: { role: ROLES.USER } }),
    User.count({ where: { role: ROLES.ADMIN } }),
    Event.count(),
    Payment.sum('amount', { where: { status: 'COMPLETED' } }),
  ]);
  ApiResponse.success(res, {
    total_workers: totalUsers,
    total_admins: totalAdmins,
    total_events: totalEvents,
    total_platform_volume: parseFloat(totalPaymentsResult || 0).toFixed(2),
  });
});

module.exports = router;
