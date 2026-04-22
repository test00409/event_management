'use strict';
const router = require('express').Router();
const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { Event, Application, Hire, Payment, Rating, User } = require('../../database/models');
const { EVENT_STATUS, PAYMENT_STATUS } = require('../../utils/constants');
const { ApiResponse } = require('../../utils/response');
const { authenticate, requireAdminOnly } = require('../../middleware/auth');

router.get('/dashboard', authenticate, requireAdminOnly, async (req, res) => {
  const adminId = req.user.id;

  const [
    totalEvents, publishedEvents, completedEvents,
    totalHires, totalSpent,
    avgRating, fillData, recentPayments,
  ] = await Promise.all([
    Event.count({ where: { admin_id: adminId } }),
    Event.count({ where: { admin_id: adminId, status: EVENT_STATUS.PUBLISHED } }),
    Event.count({ where: { admin_id: adminId, status: EVENT_STATUS.COMPLETED } }),
    Hire.count({ where: { admin_id: adminId } }),
    Payment.sum('amount', { where: { payer_id: adminId, status: PAYMENT_STATUS.COMPLETED } }),
    Rating.findOne({
      where: sequelize.literal(`hire_id IN (SELECT id FROM hires WHERE admin_id = '${adminId}')`),
      attributes: [[sequelize.fn('AVG', sequelize.col('stars')), 'avg']],
      raw: true,
    }),
    Event.findAll({
      where: { admin_id: adminId, status: EVENT_STATUS.COMPLETED },
      attributes: ['id', 'title', 'total_slots', 'filled_slots', 'event_date'],
      order: [['event_date', 'DESC']],
      limit: 5,
    }),
    Payment.findAll({
      where: { payer_id: adminId },
      attributes: ['amount', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5,
    }),
  ]);

  const avgFillRate = fillData.length > 0
    ? fillData.reduce((sum, e) => sum + (e.total_slots > 0 ? (e.filled_slots / e.total_slots) * 100 : 0), 0) / fillData.length
    : 0;

  ApiResponse.success(res, {
    overview: {
      total_events: totalEvents,
      published_events: publishedEvents,
      completed_events: completedEvents,
      total_workers_hired: totalHires,
      total_spent: parseFloat(totalSpent || 0).toFixed(2),
      average_worker_rating: parseFloat(avgRating?.avg || 0).toFixed(2),
      average_fill_rate_percent: parseFloat(avgFillRate).toFixed(1),
    },
    recent_events: fillData,
    recent_payments: recentPayments,
  });
});

module.exports = router;
