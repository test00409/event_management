'use strict';
const Joi = require('joi');

const phone = Joi.string()
  .pattern(/^[6-9]\d{9}$/)
  .required()
  .messages({ 'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number' });

const uuid = Joi.string().uuid({ version: 'uuidv4' }).required();
const optionalUuid = Joi.string().uuid({ version: 'uuidv4' }).optional();
const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

// ── Auth ─────────────────────────────────────────────────────────────────────
const sendOtpSchema = Joi.object({ phone });
const verifyOtpSchema = Joi.object({
  phone,
  otp: Joi.string().length(4).pattern(/^\d{4}$/).required(),
});
const setPasswordSchema = Joi.object({
  phone,
  password: Joi.string().min(6).required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'confirm_password must match password' }),
});
const resetPasswordSchema = Joi.object({
  phone,
  password: Joi.string().min(6).required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'confirm_password must match password' }),
});
const loginSchema = Joi.object({
  phone,
  password: Joi.string().required(),
  fcm_token: Joi.string().max(500).optional(),
});
const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

// ── Admin Signup ─────────────────────────────────────────────────────────────
const adminSignupSchema = Joi.object({
  company_name: Joi.string().min(2).max(200).required(),
  company_type: Joi.string().max(100).optional(),
  company_address: Joi.string().max(500).optional(),
  company_website: Joi.string().uri().max(300).optional(),
  gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional()
    .messages({ 'string.pattern.base': 'Invalid GSTIN format' }),
  contact_person: Joi.string().min(2).max(100).required(),
  contact_email: Joi.string().email().max(200).optional(),
});

// ── Event ────────────────────────────────────────────────────────────────────
const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(2000).optional(),
  venue: Joi.string().min(5).max(300).required(),
  venue_latitude: Joi.number().min(-90).max(90).optional(),
  venue_longitude: Joi.number().min(-180).max(180).optional(),
  city: Joi.string().max(100).optional(),
  event_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
    .messages({ 'string.pattern.base': 'event_date must be YYYY-MM-DD' }),
  start_time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).required()
    .messages({ 'string.pattern.base': 'start_time must be HH:MM or HH:MM:SS' }),
  end_time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).optional(),
  budget: Joi.number().positive().max(10000000).required(),
  required_skills: Joi.array().items(Joi.string()).optional(),
});

const updateEventSchema = createEventSchema.fork(
  ['title', 'venue', 'event_date', 'start_time', 'budget'],
  (s) => s.optional()
);

// ── Event Role ───────────────────────────────────────────────────────────────
const createEventRoleSchema = Joi.object({
  role_name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  slots: Joi.number().integer().min(1).max(1000).required(),
  pay_per_slot: Joi.number().positive().required(),
  required_skills: Joi.array().items(Joi.string()).optional(),
  start_time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).optional(),
  end_time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).optional(),
  location_notes: Joi.string().max(300).optional(),
});

// ── Application ──────────────────────────────────────────────────────────────
const applySchema = Joi.object({
  event_id: uuid,
  event_role_id: uuid,
  cover_note: Joi.string().max(1000).optional(),
});

const updateApplicationStatusSchema = Joi.object({
  status: Joi.string().valid('ACCEPTED', 'REJECTED').required(),
  admin_notes: Joi.string().max(500).optional(),
});

// ── Task ─────────────────────────────────────────────────────────────────────
const createTaskSchema = Joi.object({
  hire_id: uuid,
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).optional(),
  location: Joi.string().max(300).optional(),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('MEDIUM'),
  notes: Joi.string().max(500).optional(),
});

// ── Attendance ───────────────────────────────────────────────────────────────
const checkInSchema = Joi.object({
  event_id: uuid,
  qr_token: Joi.string().optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
});

// ── Chat ─────────────────────────────────────────────────────────────────────
const startChatSchema = Joi.object({ hire_id: uuid });
const sendMessageSchema = Joi.object({
  chat_id: uuid,
  content: Joi.string().min(1).max(2000).required(),
  message_type: Joi.string().valid('TEXT', 'IMAGE', 'FILE').default('TEXT'),
});

// ── Rating ───────────────────────────────────────────────────────────────────
const createRatingSchema = Joi.object({
  hire_id: uuid,
  stars: Joi.number().integer().min(1).max(5).required(),
  review: Joi.string().max(1000).optional(),
  aspects: Joi.object({
    punctuality: Joi.number().integer().min(1).max(5).optional(),
    skill: Joi.number().integer().min(1).max(5).optional(),
    attitude: Joi.number().integer().min(1).max(5).optional(),
    communication: Joi.number().integer().min(1).max(5).optional(),
  }).optional(),
});

// ── Profile ──────────────────────────────────────────────────────────────────
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  bio: Joi.string().max(1000).optional(),
  location: Joi.string().max(255).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  skills: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  portfolio_links: Joi.array().items(Joi.string().uri()).max(10).optional(),
  fcm_token: Joi.string().max(500).optional(),
});

// ── Talent Pool ──────────────────────────────────────────────────────────────
const saveTalentSchema = Joi.object({
  user_id: uuid,
  notes: Joi.string().max(500).optional(),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional(),
});

// ── Replace Worker ───────────────────────────────────────────────────────────
const replaceWorkerSchema = Joi.object({
  original_hire_id: uuid,
  replacement_application_id: uuid,
  issue_type: Joi.string().valid('NO_SHOW', 'MISCONDUCT', 'PERFORMANCE', 'OTHER').required(),
  description: Joi.string().max(500).optional(),
});

// ── Wallet Withdraw ──────────────────────────────────────────────────────────
const withdrawSchema = Joi.object({
  amount: Joi.number().positive().max(100000).required(),
  bank_account: Joi.string().max(200).optional(),
  notes: Joi.string().max(200).optional(),
});

// ── Super Admin ──────────────────────────────────────────────────────────────
const verifyAdminSchema = Joi.object({
  action: Joi.string().valid('APPROVED', 'REJECTED').required(),
  notes: Joi.string().max(500).optional(),
});

const blockUserSchema = Joi.object({
  user_id: uuid,
  block: Joi.boolean().required(),
  reason: Joi.string().max(300).optional(),
});

// ── Query Schemas ────────────────────────────────────────────────────────────
const jobsQuerySchema = Joi.object({
  location: Joi.string().max(100).optional(),
  skill: Joi.string().max(50).optional(),
  min_pay: Joi.number().positive().optional(),
  max_pay: Joi.number().positive().optional(),
  date_from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ...paginationQuery,
});

module.exports = {
  sendOtpSchema, verifyOtpSchema, setPasswordSchema, resetPasswordSchema, loginSchema, refreshTokenSchema,
  adminSignupSchema,
  createEventSchema, updateEventSchema,
  createEventRoleSchema,
  applySchema, updateApplicationStatusSchema,
  createTaskSchema,
  checkInSchema,
  startChatSchema, sendMessageSchema,
  createRatingSchema,
  updateProfileSchema,
  saveTalentSchema, replaceWorkerSchema,
  withdrawSchema,
  verifyAdminSchema, blockUserSchema,
  jobsQuerySchema, paginationQuery,
};
