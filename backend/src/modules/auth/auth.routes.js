'use strict';
const router = require('express').Router();
const controller = require('./auth.controller');
const { validateBody } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const {
  sendOtpSchema, verifyOtpSchema, setPasswordSchema, resetPasswordSchema, loginSchema, refreshTokenSchema,
} = require('../../validators/schemas');

// Worker / User auth
router.post('/send-otp', validateBody(sendOtpSchema), controller.sendOtp);
router.post('/verify-otp', validateBody(verifyOtpSchema), controller.verifyOtp);
router.post('/set-password', validateBody(setPasswordSchema), controller.setPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), controller.resetPassword);
router.post('/login', validateBody(loginSchema), controller.login);

// Admin auth (separate endpoint for clarity)
router.post('/admin/send-otp', validateBody(sendOtpSchema), controller.adminSendOtp);
router.post('/admin/verify-otp', validateBody(verifyOtpSchema), controller.adminVerifyOtp);

// Token refresh & logout
router.post('/refresh', validateBody(refreshTokenSchema), controller.refresh);
router.post('/logout', authenticate, controller.logout);

module.exports = router;
