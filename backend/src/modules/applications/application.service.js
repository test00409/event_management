'use strict';
const { v4: uuidv4 } = require('uuid');
const { Application, Event, EventRole, Hire, User, Wallet } = require('../../database/models');
const { APPLICATION_STATUS, EVENT_STATUS, ROLES } = require('../../utils/constants');
const AppError = require('../../utils/AppError');
const { addNotificationJob } = require('../../queues');
const { Notification } = require('../../database/models');
const { getPagination, getPaginationMeta } = require('../../utils/response');

class ApplicationService {
  // Worker applies for a role
  async apply(userId, data) {
    const { event_id, event_role_id, cover_note } = data;

    const event = await Event.findByPk(event_id);
    if (!event || event.status !== EVENT_STATUS.PUBLISHED) {
      throw AppError.badRequest('Event is not available for applications');
    }

    const role = await EventRole.findOne({ where: { id: event_role_id, event_id, is_active: true } });
    if (!role) throw AppError.notFound('Role not found in this event');

    if (role.filled_slots >= role.slots) {
      throw AppError.badRequest('No slots available for this role');
    }

    // Prevent duplicate applications
    const existing = await Application.findOne({ where: { event_role_id, user_id: userId } });
    if (existing) throw AppError.conflict('You have already applied for this role');

    const application = await Application.create({
      id: uuidv4(),
      event_id,
      event_role_id,
      user_id: userId,
      admin_id: event.admin_id,
      cover_note,
      status: APPLICATION_STATUS.PENDING,
    });

    return application.reload({
      include: [
        { model: Event, as: 'event', attributes: ['id', 'title', 'venue', 'event_date'] },
        { model: EventRole, as: 'role', attributes: ['id', 'role_name', 'pay_per_slot'] },
      ],
    });
  }

  // Admin updates application status
  async updateStatus(applicationId, adminId, adminRole, status, adminNotes) {
    const application = await Application.findByPk(applicationId, {
      include: [
        { model: Event, as: 'event' },
        { model: EventRole, as: 'role' },
        { model: User, as: 'applicant', attributes: ['id', 'name', 'phone', 'fcm_token'] },
      ],
    });

    if (!application) throw AppError.notFound('Application not found');

    // STRICT: Admin can only touch their own event's applications
    if (adminRole !== ROLES.SUPER_ADMIN && application.admin_id !== adminId) {
      throw AppError.forbidden('Access denied');
    }
    if (application.status !== APPLICATION_STATUS.PENDING) {
      throw AppError.badRequest(`Application is already ${application.status}`);
    }

    await application.update({ status, admin_notes: adminNotes, reviewed_at: new Date() });

    // If accepted → create Hire record
    if (status === APPLICATION_STATUS.ACCEPTED) {
      const role = application.role;
      if (role.filled_slots >= role.slots) {
        await application.update({ status: APPLICATION_STATUS.REJECTED, admin_notes: 'All slots filled' });
        throw AppError.badRequest('All slots for this role are now filled');
      }

      const hire = await Hire.create({
        id: uuidv4(),
        application_id: applicationId,
        event_id: application.event_id,
        event_role_id: application.event_role_id,
        user_id: application.user_id,
        admin_id: adminId,
        agreed_pay: role.pay_per_slot,
      });

      await role.update({ filled_slots: role.filled_slots + 1 });
      await application.event.update({ filled_slots: application.event.filled_slots + 1 });

      // Persist notification
      await Notification.create({
        id: uuidv4(),
        user_id: application.user_id,
        type: 'APPLICATION_ACCEPTED',
        title: 'Application Accepted!',
        body: `You've been selected for "${role.role_name}" at "${application.event.title}"`,
        data: { hire_id: hire.id, event_id: application.event_id },
      });

      await addNotificationJob({
        userId: application.user_id,
        fcmToken: application.applicant.fcm_token,
        title: 'Application Accepted!',
        body: `You got the job: ${role.role_name} at ${application.event.title}`,
        data: { hire_id: hire.id },
      });
    } else {
      // Rejected
      await Notification.create({
        id: uuidv4(),
        user_id: application.user_id,
        type: 'APPLICATION_REJECTED',
        title: 'Application Update',
        body: `Your application for "${application.role?.role_name}" was not selected this time`,
        data: { application_id: applicationId },
      });

      await addNotificationJob({
        userId: application.user_id,
        fcmToken: application.applicant.fcm_token,
        title: 'Application not selected',
        body: `Your application for ${application.role?.role_name} was not selected`,
      });
    }

    return application;
  }

  // Worker: see own applications
  async myApplications(userId, query) {
    const { page, limit, offset } = getPagination(query);
    const { count, rows } = await Application.findAndCountAll({
      where: { user_id: userId },
      include: [
        { model: Event, as: 'event', attributes: ['id', 'title', 'venue', 'event_date', 'city', 'status'] },
        { model: EventRole, as: 'role', attributes: ['id', 'role_name', 'pay_per_slot'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return { applications: rows, pagination: getPaginationMeta(count, page, limit) };
  }

  // Admin/SuperAdmin: get single application (with ownership guard)
  async getOne(applicationId, userId, role) {
    const application = await Application.findByPk(applicationId, {
      include: [
        { model: User, as: 'applicant', attributes: ['id','name','phone','skills','average_rating','total_jobs_completed','bio','location'] },
        { model: Event, as: 'event', attributes: ['id','title','venue','event_date'] },
        { model: EventRole, as: 'role' },
      ],
    });
    if (!application) throw AppError.notFound('Application not found');
    if (role !== ROLES.SUPER_ADMIN && application.admin_id !== userId && application.user_id !== userId) {
      throw AppError.forbidden('Access denied');
    }
    return application;
  }
}

module.exports = new ApplicationService();
