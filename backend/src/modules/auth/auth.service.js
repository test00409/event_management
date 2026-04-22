'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { User, Admin, Wallet } = require('../../database/models');
const { initiateOTP, verifyOTP } = require('../../utils/otp');
const { generateTokenPair, verifyRefreshToken } = require('../../utils/jwt');
const { redisService } = require('../../config/redis');
const { ROLES, REDIS_KEYS } = require('../../utils/constants');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

class AuthService {
  async sendOtp(phone) {
    return initiateOTP(phone);
  }

  async verifyOtp(phone, otp) {
    await verifyOTP(phone, otp);
    await redisService.set(REDIS_KEYS.OTP_VERIFIED(phone), '1', 'EX', 10 * 60);

    return { verified: true };
  }

  async setPassword(phone, password) {
    const otpVerified = await redisService.get(REDIS_KEYS.OTP_VERIFIED(phone));
    if (!otpVerified) {
      throw AppError.badRequest('Phone verification required before setting password');
    }

    let user = await User.findOne({ where: { phone } });
    if (!user) {
      user = await User.create({
        id: uuidv4(),
        phone,
        name: `User_${phone.slice(-4)}`,
        role: ROLES.USER,
      });
      await Wallet.create({ id: uuidv4(), user_id: user.id });
      logger.info(`New user registered: ${phone}`);
    }

    if (user.is_blocked) throw AppError.forbidden('Account is blocked');
    if (!user.is_active) throw AppError.forbidden('Account is inactive');

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({
      password: hashedPassword,
      is_password_set: true,
    });
    await redisService.del(REDIS_KEYS.OTP_VERIFIED(phone));

    return {
      message: 'Password set successfully',
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role, is_password_set: true },
    };
  }

  async resetPassword(phone, password) {
    const otpVerified = await redisService.get(REDIS_KEYS.OTP_VERIFIED(phone));
    if (!otpVerified) {
      throw AppError.badRequest('Phone verification required before resetting password');
    }

    const user = await User.findOne({ where: { phone } });
    if (!user) throw AppError.notFound('User not found');
    if (user.is_blocked) throw AppError.forbidden('Account is blocked');
    if (!user.is_active) throw AppError.forbidden('Account is inactive');

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({
      password: hashedPassword,
      is_password_set: true,
    });
    await redisService.del(REDIS_KEYS.OTP_VERIFIED(phone));
    await redisService.del(REDIS_KEYS.REFRESH_TOKEN(user.id, user.role));

    return {
      message: 'Password reset successfully',
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role, is_password_set: true },
    };
  }

  async login(phone, password, fcmToken) {
    const user = await User.findOne({ where: { phone } });
    if (!user) throw AppError.unauthorized('Invalid phone or password');
    if (user.is_blocked) throw AppError.forbidden('Account is blocked');
    if (!user.is_active) throw AppError.forbidden('Account is inactive');
    if (!user.password || !user.is_password_set) {
      throw AppError.forbidden('Password is not set for this account');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw AppError.unauthorized('Invalid phone or password');

    await user.update({
      last_login: new Date(),
      ...(fcmToken ? { fcm_token: fcmToken } : {}),
    });

    const payload = { id: user.id, role: user.role };
    const tokens = generateTokenPair(payload);

    await redisService.set(
      REDIS_KEYS.REFRESH_TOKEN(user.id, user.role),
      tokens.refreshToken,
      'EX',
      7 * 24 * 60 * 60
    );

    return {
      tokens,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    };
  }

  async adminVerifyOtp(phone, otp, name, fcmToken) {
    await verifyOTP(phone, otp);

    let user = await User.findOne({ where: { phone, role: ROLES.ADMIN } });
    let isNew = false; 

    if (!user) {
      // Create as regular user first — role upgrades to ADMIN after admin profile creation
      user = await User.findOne({ where: { phone } });
      if (user && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
        // Existing USER trying to login as admin — reject
        throw AppError.forbidden('This phone is registered as a Worker. Use a different number for Admin.');
      }
      if (!user) {
        user = await User.create({
          id: uuidv4(),
          phone,
          name: name || `Admin_${phone.slice(-4)}`,
          role: ROLES.ADMIN,
          fcm_token: fcmToken || null,
        });
        isNew = true;
        logger.info(`New admin user created: ${phone}`);
      }
    } else {
      await user.update({ last_login: new Date(), ...(fcmToken ? { fcm_token: fcmToken } : {}) });
    }

    if (user.is_blocked) throw AppError.forbidden('Account is blocked');

    const payload = { id: user.id, role: user.role };
    const tokens = generateTokenPair(payload);

    await redisService.set(
      REDIS_KEYS.REFRESH_TOKEN(user.id, user.role),
      tokens.refreshToken,
      'EX',
      7 * 24 * 60 * 60
    );

    return {
      isNew,
      tokens,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    };
  }

  async refreshTokens(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    const storedToken = await redisService.get(REDIS_KEYS.REFRESH_TOKEN(decoded.id, decoded.role));

    if (!storedToken || storedToken !== refreshToken) {
      throw AppError.unauthorized('Refresh token is invalid or expired');
    }

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'is_active', 'is_blocked'],
    });
    if (!user || !user.is_active || user.is_blocked) {
      throw AppError.unauthorized('User account is not accessible');
    }

    const payload = { id: user.id, role: user.role };
    const tokens = generateTokenPair(payload);

    // Rotate refresh token
    await redisService.set(
      REDIS_KEYS.REFRESH_TOKEN(user.id, user.role),
      tokens.refreshToken,
      'EX',
      7 * 24 * 60 * 60
    );

    return tokens;
  }

  async logout(userId, role) {
    await redisService.del(REDIS_KEYS.REFRESH_TOKEN(userId, role));
    return { message: 'Logged out successfully' };
  }
}

module.exports = new AuthService();
