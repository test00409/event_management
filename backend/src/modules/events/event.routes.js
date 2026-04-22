'use strict';
const router = require('express').Router();
const eventService = require('./event.service');
const { ApiResponse } = require('../../utils/response');
const { authenticate, requireAdmin, requireAdminOnly } = require('../../middleware/auth');
const { validateBody, validateQuery } = require('../../middleware/validate');
const {
  createEventSchema, updateEventSchema, createEventRoleSchema, jobsQuerySchema,
} = require('../../validators/schemas');
const Joi = require('joi');

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('DRAFT','PUBLISHED','ONGOING','COMPLETED','CANCELLED').optional(),
  city: Joi.string().optional(),
  application_status: Joi.string().optional(),
});

class EventController {
  async create(req, res) {
    const event = await eventService.create(req.user.id, req.body);
    ApiResponse.created(res, event, 'Event created');
  }
  async list(req, res) {
    const result = await eventService.list(req.user.id, req.query);
    ApiResponse.paginated(res, result.events, result.pagination);
  }
  async getById(req, res) {
    const event = await eventService.getById(req.params.id, req.user.id, req.user.role);
    ApiResponse.success(res, event);
  }
  async update(req, res) {
    const event = await eventService.update(req.params.id, req.user.id, req.user.role, req.body);
    ApiResponse.success(res, event, 'Event updated');
  }
  async delete(req, res) {
    const result = await eventService.delete(req.params.id, req.user.id, req.user.role);
    ApiResponse.success(res, null, result.message);
  }
  async publish(req, res) {
    const event = await eventService.publish(req.params.id, req.user.id, req.user.role);
    ApiResponse.success(res, event, 'Event published');
  }
  async markComplete(req, res) {
    const event = await eventService.markComplete(req.params.id, req.user.id, req.user.role);
    ApiResponse.success(res, event, 'Event marked as complete. Payments queued for T+1 settlement.');
  }
  async getReport(req, res) {
    const report = await eventService.getReport(req.params.id, req.user.id, req.user.role);
    ApiResponse.success(res, report, 'Event report');
  }
  async addRole(req, res) {
    const role = await eventService.addRole(req.params.id, req.user.id, req.user.role, req.body);
    ApiResponse.created(res, role, 'Role added to event');
  }
  async getRoles(req, res) {
    const roles = await eventService.getRoles(req.params.id, req.user.id, req.user.role);
    ApiResponse.success(res, roles);
  }
  async getApplications(req, res) {
    const result = await eventService.getApplications(req.params.id, req.user.id, req.user.role, req.query);
    ApiResponse.paginated(res, result.applications, result.pagination);
  }
  // Public: worker browsing
  async browseJobs(req, res) {
    const result = await eventService.browse(req.query);
    ApiResponse.paginated(res, result.events, result.pagination);
  }
  async getJobDetails(req, res) {
    // Public event details for workers — no ownership check
    const { Event: EventModel, EventRole, User } = require('../../database/models');
    const { EVENT_STATUS } = require('../../utils/constants');
    const event = await EventModel.findOne({
      where: { id: req.params.id, status: EVENT_STATUS.PUBLISHED },
      include: [
        { model: EventRole, as: 'roles', where: { is_active: true }, attributes: ['id','role_name','slots','filled_slots','pay_per_slot','required_skills','description'] },
        { model: User, as: 'organizer', attributes: ['id','name'] },
      ],
    });
    if (!event) throw require('../../utils/AppError').notFound('Job not found or not available');
    ApiResponse.success(res, event);
  }
}

const c = new EventController();

// ── Admin-protected routes ────────────────────────────────────────────────────
router.post('/', authenticate, requireAdminOnly, validateBody(createEventSchema), c.create);
router.get('/', authenticate, requireAdminOnly, validateQuery(paginationSchema), c.list);
router.get('/:id', authenticate, requireAdmin, c.getById);
router.patch('/:id', authenticate, requireAdminOnly, validateBody(updateEventSchema), c.update);
router.delete('/:id', authenticate, requireAdminOnly, c.delete);
router.patch('/:id/publish', authenticate, requireAdminOnly, c.publish);
router.patch('/:id/complete', authenticate, requireAdminOnly, c.markComplete);
router.get('/:id/report', authenticate, requireAdmin, c.getReport);
router.post('/:id/roles', authenticate, requireAdminOnly, validateBody(createEventRoleSchema), c.addRole);
router.get('/:id/roles', authenticate, requireAdmin, c.getRoles);
router.get('/:id/applications', authenticate, requireAdmin, validateQuery(paginationSchema), c.getApplications);

module.exports = router;

// Separate public job routes (mounted at /jobs)
const jobRouter = require('express').Router();
jobRouter.get('/', validateQuery(jobsQuerySchema), c.browseJobs);
jobRouter.get('/recommended', authenticate, async (req, res) => {
  // AI-like recommendation: match by user skills + location
  const { User: UserModel, Event: EventModel, EventRole, Application } = require('../../database/models');
  const { EVENT_STATUS } = require('../../utils/constants');
  const { Op } = require('sequelize');

  const user = await UserModel.findByPk(req.user.id, { attributes: ['skills','location'] });
  const appliedEventIds = (await Application.findAll({
    where: { user_id: req.user.id },
    attributes: ['event_id'],
  })).map(a => a.event_id);

  const where = { status: EVENT_STATUS.PUBLISHED };
  if (appliedEventIds.length) where.id = { [Op.notIn]: appliedEventIds };

  const events = await EventModel.findAll({
    where,
    include: [{ model: EventRole, as: 'roles', where: { is_active: true } }],
    order: [['event_date', 'ASC']],
    limit: 10,
  });

  // Score by skill match
  const userSkills = (user?.skills || []).map(s => s.toLowerCase());
  const scored = events
    .map(e => {
      const roleSkills = e.roles.flatMap(r => r.required_skills || []).map(s => s.toLowerCase());
      const matchCount = userSkills.filter(s => roleSkills.includes(s)).length;
      return { event: e, score: matchCount };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(x => x.event);

  ApiResponse.success(res, scored, 'Recommended jobs based on your skills');
});
jobRouter.get('/:id', c.getJobDetails);

module.exports.jobRouter = jobRouter;
