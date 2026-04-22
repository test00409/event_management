'use strict';
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { Attendance, Hire, Event, User } = require('../../database/models');
const { ROLES, ATTENDANCE_STATUS } = require('../../utils/constants');
const AppError = require('../../utils/AppError');
const { ApiResponse } = require('../../utils/response');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const { checkInSchema } = require('../../validators/schemas');

class AttendanceService {
  // Generate a QR token for an event (admin)
  async generateQR(eventId, adminId, role) {
    const event = await Event.findByPk(eventId);
    if (!event) throw AppError.notFound('Event not found');
    if (role !== ROLES.SUPER_ADMIN && event.admin_id !== adminId) throw AppError.forbidden('Access denied');

    const qrToken = crypto.createHmac('sha256', process.env.JWT_ACCESS_SECRET)
      .update(`${eventId}:${event.event_date}`)
      .digest('hex');

    await event.update({ qr_code: qrToken });
    return { event_id: eventId, qr_token: qrToken, valid_for: 'Event day check-in' };
  }

  // Worker checks in
  async checkIn(userId, data) {
    const { event_id, qr_token, latitude, longitude } = data;

    const hire = await Hire.findOne({ where: { event_id, user_id: userId } });
    if (!hire) throw AppError.forbidden('You are not hired for this event');

    const existing = await Attendance.findOne({ where: { event_id, user_id: userId } });
    if (existing) throw AppError.conflict('Already checked in for this event');

    // Validate QR token if provided
    if (qr_token) {
      const event = await Event.findByPk(event_id);
      if (!event || event.qr_code !== qr_token) throw AppError.badRequest('Invalid QR code');
    }

    return Attendance.create({
      id: uuidv4(),
      event_id,
      hire_id: hire.id,
      user_id: userId,
      admin_id: hire.admin_id,
      status: ATTENDANCE_STATUS.CHECKED_IN,
      check_in_time: new Date(),
      check_in_method: qr_token ? 'QR' : 'MANUAL',
      check_in_latitude: latitude || null,
      check_in_longitude: longitude || null,
    });
  }

  // Worker checks out
  async checkOut(userId, eventId) {
    const record = await Attendance.findOne({ where: { event_id: eventId, user_id: userId } });
    if (!record) throw AppError.notFound('No check-in record found');
    if (record.status === ATTENDANCE_STATUS.CHECKED_OUT) throw AppError.conflict('Already checked out');
    await record.update({ status: ATTENDANCE_STATUS.CHECKED_OUT, check_out_time: new Date() });
    return record;
  }

  // Admin: view attendance for event
  async getEventAttendance(eventId, adminId, role) {
    const event = await Event.findByPk(eventId);
    if (!event) throw AppError.notFound('Event not found');
    if (role !== ROLES.SUPER_ADMIN && event.admin_id !== adminId) throw AppError.forbidden('Access denied');

    return Attendance.findAll({
      where: { event_id: eventId },
      include: [{ model: User, as: 'worker', attributes: ['id', 'name', 'phone'] }],
      order: [['check_in_time', 'ASC']],
    });
  }
}

const attendanceService = new AttendanceService();

// Generate QR for event (admin)
router.get('/qr/:eventId', authenticate, requireAdmin, async (req, res) => {
  const result = await attendanceService.generateQR(req.params.eventId, req.user.id, req.user.role);
  ApiResponse.success(res, result, 'QR token generated');
});

// Worker check-in
router.post('/check-in', authenticate, validateBody(checkInSchema), async (req, res) => {
  const record = await attendanceService.checkIn(req.user.id, req.body);
  ApiResponse.created(res, record, 'Checked in successfully');
});

// Worker check-out
router.post('/check-out', authenticate, async (req, res) => {
  const { event_id } = req.body;
  if (!event_id) throw AppError.badRequest('event_id is required');
  const record = await attendanceService.checkOut(req.user.id, event_id);
  ApiResponse.success(res, record, 'Checked out successfully');
});

// Get event attendance (admin) — also exported for nested route
const getEventAttendanceHandler = async (req, res) => {
  const records = await attendanceService.getEventAttendance(req.params.id, req.user.id, req.user.role);
  ApiResponse.success(res, records);
};

module.exports = router;
module.exports.getEventAttendanceHandler = getEventAttendanceHandler;
