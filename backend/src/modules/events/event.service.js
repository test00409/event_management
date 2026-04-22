'use strict';
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Event, EventRole, User, Application, Hire, Attendance, Payment, Rating } = require('../../database/models');
const { EVENT_STATUS, ROLES } = require('../../utils/constants');
const { redisService } = require('../../config/redis');
const { REDIS_KEYS } = require('../../utils/constants');
const AppError = require('../../utils/AppError');
const { getPagination, getPaginationMeta } = require('../../utils/response');
const logger = require('../../utils/logger');

class EventService {
  // ── Ownership guard ──────────────────────────────────────────────────────
  async _assertOwnership(eventId, adminId, role) {
    const event = await Event.findByPk(eventId);
    if (!event || event.deleted_at) throw AppError.notFound('Event not found');
    if (role !== ROLES.SUPER_ADMIN && event.admin_id !== adminId) {
      throw AppError.forbidden('You do not have access to this event');
    }
    return event;
  }

  // ── Create ───────────────────────────────────────────────────────────────
  async create(adminId, data) {
    const event = await Event.create({ id: uuidv4(), admin_id: adminId, ...data });
    await redisService.del(REDIS_KEYS.ADMIN_EVENTS(adminId));
    return event;
  }

  // ── List admin's own events ──────────────────────────────────────────────
  async list(adminId, query) {
    const { page, limit, offset } = getPagination(query);
    const where = { admin_id: adminId };
    if (query.status) where.status = query.status;
    if (query.city) where.city = { [Op.like]: `%${query.city}%` };

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [{ model: EventRole, as: 'roles', attributes: ['id', 'role_name', 'slots', 'filled_slots', 'pay_per_slot'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { events: rows, pagination: getPaginationMeta(count, page, limit) };
  }

  // ── Get single event (with ownership check) ──────────────────────────────
  async getById(eventId, userId, role) {
    const event = await this._assertOwnership(eventId, userId, role);
    return event.reload({
      include: [
        { model: EventRole, as: 'roles' },
        { model: User, as: 'organizer', attributes: ['id', 'name', 'phone'] },
      ],
    });
  }

  // ── Update ───────────────────────────────────────────────────────────────
  async update(eventId, adminId, role, data) {
    const event = await this._assertOwnership(eventId, adminId, role);
    if (event.status === EVENT_STATUS.COMPLETED) throw AppError.badRequest('Cannot edit a completed event');
    await event.update(data);
    await redisService.del(REDIS_KEYS.EVENT_CACHE(eventId));
    await redisService.del(REDIS_KEYS.ADMIN_EVENTS(adminId));
    return event;
  }

  // ── Delete (soft) ────────────────────────────────────────────────────────
  async delete(eventId, adminId, role) {
    const event = await this._assertOwnership(eventId, adminId, role);
    if ([EVENT_STATUS.ONGOING, EVENT_STATUS.COMPLETED].includes(event.status)) {
      throw AppError.badRequest('Cannot delete an ongoing or completed event');
    }
    await event.destroy(); // Sequelize paranoid soft delete
    await redisService.del(REDIS_KEYS.EVENT_CACHE(eventId));
    await redisService.del(REDIS_KEYS.ADMIN_EVENTS(adminId));
    return { message: 'Event deleted' };
  }

  // ── Publish ──────────────────────────────────────────────────────────────
  async publish(eventId, adminId, role) {
    const event = await this._assertOwnership(eventId, adminId, role);
    if (event.status !== EVENT_STATUS.DRAFT) throw AppError.badRequest('Only DRAFT events can be published');

    const roles = await EventRole.count({ where: { event_id: eventId, is_active: true } });
    if (roles === 0) throw AppError.badRequest('Add at least one role before publishing');

    const totalSlots = await EventRole.sum('slots', { where: { event_id: eventId } });
    await event.update({ status: EVENT_STATUS.PUBLISHED, published_at: new Date(), total_slots: totalSlots || 0 });
    await redisService.del(REDIS_KEYS.EVENT_CACHE(eventId));
    return event;
  }

  // ── Mark complete & trigger payment ─────────────────────────────────────
  async markComplete(eventId, adminId, role) {
    const event = await this._assertOwnership(eventId, adminId, role);
    if (![EVENT_STATUS.PUBLISHED, EVENT_STATUS.ONGOING].includes(event.status)) {
      throw AppError.badRequest('Event must be PUBLISHED or ONGOING to complete');
    }
    await event.update({ status: EVENT_STATUS.COMPLETED, completed_at: new Date() });

    // Trigger T+1 payment settlement via queue
    const { addPaymentJob } = require('../../queues');
    const hires = await Hire.findAll({ where: { event_id: eventId, work_marked_done: false } });
    for (const hire of hires) {
      await hire.update({ work_marked_done: true, work_done_at: new Date() });
      const settlementDelay = parseInt(process.env.PAYMENT_SETTLEMENT_HOURS || 24) * 3600 * 1000;
      await addPaymentJob({ hireId: hire.id, eventId }, settlementDelay);
    }

    logger.info(`Event ${eventId} completed — ${hires.length} payment jobs queued`);
    return event;
  }

  // ── Event report ─────────────────────────────────────────────────────────
  async getReport(eventId, adminId, role) {
    const event = await this._assertOwnership(eventId, adminId, role);

    const [hires, payments, ratings, attendance] = await Promise.all([
      Hire.findAll({ where: { event_id: eventId }, include: [{ model: User, as: 'worker', attributes: ['id', 'name', 'phone', 'average_rating'] }] }),
      Payment.findAll({ where: { event_id: eventId } }),
      Rating.findAll({ where: { event_id: eventId } }),
      Attendance.findAll({ where: { event_id: eventId } }),
    ]);

    const totalPaid = payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const fillRate = event.total_slots > 0 ? ((event.filled_slots / event.total_slots) * 100).toFixed(1) : 0;
    const avgRating = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(2) : 0;

    return {
      event: { id: event.id, title: event.title, status: event.status, event_date: event.event_date, venue: event.venue },
      summary: {
        total_slots: event.total_slots,
        filled_slots: event.filled_slots,
        fill_rate_percent: parseFloat(fillRate),
        total_hired: hires.length,
        total_attended: attendance.filter(a => a.status === 'CHECKED_IN').length,
        total_cost: totalPaid,
        average_worker_rating: parseFloat(avgRating),
        ratings_count: ratings.length,
      },
      workers: hires.map(h => ({ worker: h.worker, agreed_pay: h.agreed_pay, work_done: h.work_marked_done })),
      payments: payments.map(p => ({ amount: p.amount, status: p.status, settled_at: p.settled_at })),
      generated_at: new Date().toISOString(),
    };
  }

  // ── Public: Browse events (for workers) ─────────────────────────────────
  async browse(query) {
    const { page, limit, offset } = getPagination(query);
    const where = { status: EVENT_STATUS.PUBLISHED };

    if (query.city) where.city = { [Op.like]: `%${query.city}%` };
    if (query.date_from) where.event_date = { [Op.gte]: query.date_from };
    if (query.date_to) where.event_date = { ...(where.event_date || {}), [Op.lte]: query.date_to };

    const includeRoleWhere = {};
    if (query.skill) {
      includeRoleWhere.required_skills = { [Op.like]: `%${query.skill}%` };
    }
    if (query.min_pay) includeRoleWhere.pay_per_slot = { [Op.gte]: query.min_pay };

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [
        {
          model: EventRole,
          as: 'roles',
          where: Object.keys(includeRoleWhere).length ? includeRoleWhere : undefined,
          required: Object.keys(includeRoleWhere).length > 0,
          attributes: ['id', 'role_name', 'slots', 'filled_slots', 'pay_per_slot', 'required_skills'],
        },
        { model: User, as: 'organizer', attributes: ['id', 'name'] },
      ],
      order: [['event_date', 'ASC']],
      limit,
      offset,
      distinct: true,
    });

    return { events: rows, pagination: getPaginationMeta(count, page, limit) };
  }

  // ── Roles ─────────────────────────────────────────────────────────────────
  async addRole(eventId, adminId, userRole, data) {
    const event = await this._assertOwnership(eventId, adminId, userRole);
    if (event.status === EVENT_STATUS.COMPLETED) throw AppError.badRequest('Cannot add roles to a completed event');
    return EventRole.create({ id: uuidv4(), event_id: eventId, ...data });
  }

  async getRoles(eventId, adminId, userRole) {
    await this._assertOwnership(eventId, adminId, userRole);
    return EventRole.findAll({ where: { event_id: eventId, is_active: true }, order: [['created_at', 'ASC']] });
  }

  // ── Applications for admin review ────────────────────────────────────────
  async getApplications(eventId, adminId, userRole, query) {
    await this._assertOwnership(eventId, adminId, userRole);
    const { page, limit, offset } = getPagination(query);
    const where = { event_id: eventId };
    if (query.status) where.status = query.status;

    const { count, rows } = await Application.findAndCountAll({
      where,
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'name', 'phone', 'skills', 'average_rating', 'total_jobs_completed', 'location', 'bio'] },
        { model: EventRole, as: 'role', attributes: ['id', 'role_name', 'pay_per_slot'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { applications: rows, pagination: getPaginationMeta(count, page, limit) };
  }
}

module.exports = new EventService();
