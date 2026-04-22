'use strict';
const router = require('express').Router();
const { User, Application, Hire, Wallet } = require('../../database/models');
const AppError = require('../../utils/AppError');
const { ApiResponse } = require('../../utils/response');
const { authenticate, requireUser } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const { updateProfileSchema } = require('../../validators/schemas');

class UserService {
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['fcm_token', 'is_blocked', 'block_reason'] },
      include: [{ model: Wallet, as: 'wallet', attributes: ['balance', 'pending_amount', 'total_earned'] }],
    });
    if (!user) throw AppError.notFound('User not found');
    return user;
  }

  async updateProfile(userId, data) {
    const user = await User.findByPk(userId);
    if (!user) throw AppError.notFound('User not found');
    await user.update(data);
    return user.reload({ attributes: { exclude: ['fcm_token', 'is_blocked', 'block_reason'] } });
  }

  async getStats(userId) {
    const [totalApps, acceptedApps, completedJobs] = await Promise.all([
      Application.count({ where: { user_id: userId } }),
      Application.count({ where: { user_id: userId, status: 'ACCEPTED' } }),
      Hire.count({ where: { user_id: userId, work_marked_done: true } }),
    ]);
    const user = await User.findByPk(userId, { attributes: ['average_rating', 'total_ratings', 'badges', 'total_jobs_completed'] });
    return {
      total_applications: totalApps,
      accepted_applications: acceptedApps,
      completed_jobs: completedJobs,
      average_rating: user.average_rating,
      total_ratings: user.total_ratings,
      badges: user.badges,
    };
  }
}

const userService = new UserService();

router.get('/profile', authenticate, async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  ApiResponse.success(res, user);
});

router.put('/profile', authenticate, validateBody(updateProfileSchema), async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  ApiResponse.success(res, user, 'Profile updated');
});

router.get('/stats', authenticate, async (req, res) => {
  const stats = await userService.getStats(req.user.id);
  ApiResponse.success(res, stats);
});

module.exports = router;
