'use strict';
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { TalentPool, User } = require('../../database/models');
const AppError = require('../../utils/AppError');
const { ApiResponse } = require('../../utils/response');
const { authenticate, requireAdminOnly } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const { saveTalentSchema } = require('../../validators/schemas');

// Save a worker to talent pool
router.post('/save-worker', authenticate, requireAdminOnly, validateBody(saveTalentSchema), async (req, res) => {
  const { user_id, notes, tags } = req.body;

  const worker = await User.findByPk(user_id, { attributes: ['id', 'name', 'role'] });
  if (!worker || worker.role !== 'USER') throw AppError.notFound('Worker not found');

  const [entry, created] = await TalentPool.findOrCreate({
    where: { admin_id: req.user.id, user_id },
    defaults: { id: uuidv4(), admin_id: req.user.id, user_id, notes, tags },
  });

  if (!created) await entry.update({ notes, tags });

  ApiResponse.success(res, entry, created ? 'Worker saved to talent pool' : 'Talent pool entry updated');
});

// Get talent pool (admin sees only their own)
router.get('/workers', authenticate, requireAdminOnly, async (req, res) => {
  const entries = await TalentPool.findAll({
    where: { admin_id: req.user.id },
    include: [{
      model: User,
      as: 'worker',
      attributes: ['id', 'name', 'phone', 'skills', 'average_rating', 'total_jobs_completed', 'location', 'badges'],
    }],
    order: [['created_at', 'DESC']],
  });
  ApiResponse.success(res, entries);
});

// Remove from talent pool
router.delete('/workers/:userId', authenticate, requireAdminOnly, async (req, res) => {
  const deleted = await TalentPool.destroy({
    where: { admin_id: req.user.id, user_id: req.params.userId },
  });
  if (!deleted) throw AppError.notFound('Worker not found in talent pool');
  ApiResponse.success(res, null, 'Removed from talent pool');
});

module.exports = router;
