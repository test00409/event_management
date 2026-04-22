'use strict';
const authService = require('./auth.service');
const { ApiResponse } = require('../../utils/response');

class AuthController {
  async sendOtp(req, res) {
    const { phone } = req.body;
    const result = await authService.sendOtp(phone);
    ApiResponse.success(res, result, 'OTP sent successfully');
  }

  async verifyOtp(req, res) {
    const { phone, otp } = req.body;
    const result = await authService.verifyOtp(phone, otp);
    ApiResponse.success(res, result, 'OTP verified successfully');
  }

  async setPassword(req, res) {
    const { phone, password } = req.body;
    const result = await authService.setPassword(phone, password);
    ApiResponse.success(res, result, 'Password set successfully');
  }

  async resetPassword(req, res) {
    const { phone, password } = req.body;
    const result = await authService.resetPassword(phone, password);
    ApiResponse.success(res, result, 'Password reset successfully');
  }

  async login(req, res) {
    const { phone, password, fcm_token } = req.body;
    const result = await authService.login(phone, password, fcm_token);
    ApiResponse.success(res, result, 'Login successful');
  }

  async adminSendOtp(req, res) {
    const { phone } = req.body;
    const result = await authService.sendOtp(phone);
    ApiResponse.success(res, result, 'OTP sent successfully');
  }

  async adminVerifyOtp(req, res) {
    const { phone, otp, name, fcm_token } = req.body;
    const result = await authService.adminVerifyOtp(phone, otp, name, fcm_token);
    ApiResponse.success(res, result, result.isNew ? 'Admin account created' : 'Admin login successful');
  }

  async refresh(req, res) {
    const { refresh_token } = req.body;
    const tokens = await authService.refreshTokens(refresh_token);
    ApiResponse.success(res, tokens, 'Tokens refreshed');
  }

  async logout(req, res) {
    const result = await authService.logout(req.user.id, req.user.role);
    ApiResponse.success(res, null, result.message);
  }
}

module.exports = new AuthController();
