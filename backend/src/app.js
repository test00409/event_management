'use strict';
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const eventRoutes = require('./modules/events/event.routes');
const { jobRouter } = require('./modules/events/event.routes');
const applicationRoutes = require('./modules/applications/application.routes');
const chatRoutes = require('./modules/chats/chat.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const { getEventTasksHandler } = require('./modules/tasks/task.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const { getEventAttendanceHandler } = require('./modules/attendance/attendance.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const ratingRoutes = require('./modules/ratings/rating.routes');
const userRoutes = require('./modules/user/user.routes');
const talentRoutes = require('./modules/talent/talent.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const issueRoutes = require('./modules/analytics/issue.routes');
const superAdminRoutes = require('./modules/superadmin/superadmin.routes');

const { authenticate, requireAdmin } = require('./middleware/auth');

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Global rate limiter ──────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
  skip: (req) => req.path === '/health',
}));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── HTTP request logging ─────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.path === '/health',
  }));
}

// ── Static files (uploads) ────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── API v1 routes ─────────────────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/user`, userRoutes);
app.use(`${API}/events`, eventRoutes);
app.use(`${API}/jobs`, jobRouter);
app.use(`${API}/applications`, applicationRoutes);
app.use(`${API}/chats`, chatRoutes);
app.use(`${API}/tasks`, taskRoutes);
app.use(`${API}/attendance`, attendanceRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/ratings`, ratingRoutes);
app.use(`${API}/talent`, talentRoutes);
app.use(`${API}/analytics`, analyticsRoutes);
app.use(`${API}/issues`, issueRoutes);
app.use(`${API}/super-admin`, superAdminRoutes);

// ── Nested event resource routes ──────────────────────────────────────────────
app.get(`${API}/events/:id/tasks`, authenticate, requireAdmin, getEventTasksHandler);
app.get(`${API}/events/:id/attendance`, authenticate, requireAdmin, getEventAttendanceHandler);

// ── 404 & Error handling ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
