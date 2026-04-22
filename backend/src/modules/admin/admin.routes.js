'use strict';
const router = require('express').Router();
const adminService = require('./admin.service');
const { ApiResponse } = require('../../utils/response');
const { authenticate, requireAdminOnly } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const { uploadSingle, getFileUrl } = require('../../middleware/upload');
const { adminSignupSchema } = require('../../validators/schemas');

class AdminController {
  async signup(req, res) {
    const proofUrl = req.file ? getFileUrl(req, req.file.filename, 'business-proof') : null;
    const profile = await adminService.createOrUpdateProfile(req.user.id, req.body, proofUrl);
    ApiResponse.created(res, profile, 'Admin profile submitted for verification');
  }

  async getProfile(req, res) {
    const profile = await adminService.getProfile(req.user.id);
    ApiResponse.success(res, profile);
  }

  async getVerificationStatus(req, res) {
    const status = await adminService.getVerificationStatus(req.user.id);
    ApiResponse.success(res, status);
  }
}

const controller = new AdminController();

router.post(
  '/signup',
  authenticate,
  requireAdminOnly,
  uploadSingle('business_proof', 'business-proof'),
  validateBody(adminSignupSchema),
  controller.signup
);
router.get('/profile', authenticate, requireAdminOnly, controller.getProfile);
router.get('/verification-status', authenticate, requireAdminOnly, controller.getVerificationStatus);

module.exports = router;
