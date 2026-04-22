'use strict';
const { v4: uuidv4 } = require('uuid');
const { User, Admin } = require('../../database/models');
const { ROLES, VERIFICATION_STATUS } = require('../../utils/constants');
const AppError = require('../../utils/AppError');

class AdminService {
  async createOrUpdateProfile(userId, data, businessProofUrl) {
    const user = await User.findByPk(userId);
    if (!user) throw AppError.notFound('User not found');
    if (user.role !== ROLES.ADMIN) throw AppError.forbidden('Only admin accounts can create an admin profile');

    const existing = await Admin.findOne({ where: { user_id: userId } });
    if (existing) {
      // Update profile — cannot re-submit if already approved
      if (existing.verification_status === VERIFICATION_STATUS.APPROVED) {
        // Allow updating non-sensitive fields
        await existing.update({
          company_website: data.company_website ?? existing.company_website,
          contact_email: data.contact_email ?? existing.contact_email,
          company_address: data.company_address ?? existing.company_address,
        });
        return existing.reload({ include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone'] }] });
      }
      await existing.update({ ...data, ...(businessProofUrl ? { business_proof_url: businessProofUrl } : {}) });
      return existing.reload({ include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone'] }] });
    }

    if (!businessProofUrl) throw AppError.badRequest('Business proof document is required for signup');

    const profile = await Admin.create({
      id: uuidv4(),
      user_id: userId,
      ...data,
      business_proof_url: businessProofUrl,
      verification_status: VERIFICATION_STATUS.PENDING,
    });

    return profile.reload({ include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone'] }] });
  }

  async getProfile(userId) {
    const profile = await Admin.findOne({
      where: { user_id: userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'average_rating', 'total_ratings'] }],
    });
    if (!profile) throw AppError.notFound('Admin profile not found. Please complete your profile setup.');
    return profile;
  }

  async getVerificationStatus(userId) {
    const profile = await Admin.findOne({
      where: { user_id: userId },
      attributes: ['verification_status', 'verification_notes', 'verified_at', 'is_verified'],
    });
    if (!profile) throw AppError.notFound('Admin profile not found');
    return profile;
  }
}

module.exports = new AdminService();
