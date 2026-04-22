'use strict';
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Rating, Hire, User } = require('../../database/models');
const { ROLES } = require('../../utils/constants');
const AppError = require('../../utils/AppError');
const { ApiResponse } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const { createRatingSchema } = require('../../validators/schemas');
const { sequelize } = require('../../config/database');

class RatingService {
  async create(raterId, raterRole, data) {
    const { hire_id, stars, review, aspects } = data;
    const hire = await Hire.findByPk(hire_id);
    if (!hire) throw AppError.notFound('Hire record not found');
    if (!hire.work_marked_done) throw AppError.badRequest('Cannot rate before work is marked done');

    // Determine ratee
    let rateeId, storedRaterRole;
    if (raterRole === ROLES.ADMIN) {
      if (hire.admin_id !== raterId) throw AppError.forbidden('Access denied');
      rateeId = hire.user_id;
      storedRaterRole = 'ADMIN';
    } else if (raterRole === ROLES.USER) {
      if (hire.user_id !== raterId) throw AppError.forbidden('Access denied');
      rateeId = hire.admin_id;
      storedRaterRole = 'USER';
    } else {
      throw AppError.forbidden('Only Admin and Worker can submit ratings');
    }

    // Prevent duplicate rating
    const existing = await Rating.findOne({ where: { hire_id, rater_id: raterId } });
    if (existing) throw AppError.conflict('You have already submitted a rating for this hire');

    const rating = await Rating.create({
      id: uuidv4(),
      event_id: hire.event_id,
      hire_id,
      rater_id: raterId,
      ratee_id: rateeId,
      rater_role: storedRaterRole,
      stars,
      review,
      aspects,
    });

    // Update ratee's aggregate rating
    const { avg, count } = await Rating.findOne({
      where: { ratee_id: rateeId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('stars')), 'avg'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      raw: true,
    });

    await User.update(
      { average_rating: parseFloat(avg || 0).toFixed(2), total_ratings: parseInt(count || 0) },
      { where: { id: rateeId } }
    );

    // Badge unlocking logic
    await this._updateBadges(rateeId);

    return rating;
  }

  async _updateBadges(userId) {
    const user = await User.findByPk(userId);
    if (!user) return;
    const badges = [...(user.badges || [])];
    if (user.total_jobs_completed >= 1 && !badges.includes('FIRST_JOB')) badges.push('FIRST_JOB');
    if (user.total_jobs_completed >= 10 && !badges.includes('EXPERIENCED')) badges.push('EXPERIENCED');
    if (user.total_jobs_completed >= 50 && !badges.includes('VETERAN')) badges.push('VETERAN');
    if (parseFloat(user.average_rating) >= 4.5 && user.total_ratings >= 5 && !badges.includes('TOP_RATED')) badges.push('TOP_RATED');
    if (badges.length !== (user.badges || []).length) await user.update({ badges });
  }

  async getForUser(userId) {
    return Rating.findAll({
      where: { ratee_id: userId },
      include: [{ model: User, as: 'rater', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });
  }
}

const ratingService = new RatingService();

router.post('/', authenticate, validateBody(createRatingSchema), async (req, res) => {
  const rating = await ratingService.create(req.user.id, req.user.role, req.body);
  ApiResponse.created(res, rating, 'Rating submitted');
});

router.get('/user/:userId', authenticate, async (req, res) => {
  const ratings = await ratingService.getForUser(req.params.userId);
  ApiResponse.success(res, ratings);
});

module.exports = router;
module.exports.ratingService = ratingService;
