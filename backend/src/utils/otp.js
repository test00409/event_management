'use strict';
const crypto = require('crypto');
const { redisService } = require('../config/redis');
const { REDIS_KEYS } = require('./constants');
const AppError = require('./AppError');
const logger = require('./logger');

const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_SECONDS) || 300;
const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;
const BLOCK_DURATION = parseInt(process.env.OTP_BLOCK_DURATION_SECONDS) || 1800;
const RATE_WINDOW = parseInt(process.env.OTP_RATE_LIMIT_WINDOW) || 60;
const RATE_MAX = parseInt(process.env.OTP_RATE_LIMIT_MAX) || 3;

const generateOTP = () => {
  // Cryptographically secure 6-digit OTP
  return String(crypto.randomInt(1000, 10000));
};

const sendOTPToPhone = async (phone, otp) => {
  // In production: integrate SMS gateway (Twilio, MSG91, etc.)
  // For development: log the OTP
  logger.info(`[OTP SERVICE] Phone: ${phone} | OTP: ${otp} | Expires in: ${OTP_EXPIRY}s`);
  return true;
};

const checkRateLimit = async (phone) => {
  const rateLimitKey = REDIS_KEYS.OTP_RATE(phone);
  const count = await redisService.incr(rateLimitKey);
  if (count === 1) {
    await redisService.expire(rateLimitKey, RATE_WINDOW);
  }
  if (count > RATE_MAX) {
    const ttl = await redisService.ttl(rateLimitKey);
    throw AppError.tooMany(`Too many OTP requests. Try again in ${ttl} seconds.`);
  }
};

const checkBlocked = async (phone) => {
  const blocked = await redisService.get(REDIS_KEYS.OTP_BLOCKED(phone));
  if (blocked) {
    const ttl = await redisService.ttl(REDIS_KEYS.OTP_BLOCKED(phone));
    throw AppError.tooMany(`Phone number blocked due to multiple failed attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`);
  }
};

const storeOTP = async (phone, otp) => {
  await redisService.set(REDIS_KEYS.OTP(phone), otp, 'EX', OTP_EXPIRY);
  // Reset attempts on new OTP send
  await redisService.del(REDIS_KEYS.OTP_ATTEMPTS(phone));
};

const verifyOTP = async (phone, inputOtp) => {
  await checkBlocked(phone);

  const storedOtp = await redisService.get(REDIS_KEYS.OTP(phone));
  if (!storedOtp) {
    throw AppError.badRequest('OTP expired or not found. Please request a new OTP.');
  }

  // Track failed attempts
  if (storedOtp !== inputOtp) {
    const attempts = await redisService.incr(REDIS_KEYS.OTP_ATTEMPTS(phone));
    await redisService.expire(REDIS_KEYS.OTP_ATTEMPTS(phone), OTP_EXPIRY);

    if (attempts >= MAX_ATTEMPTS) {
      await redisService.set(REDIS_KEYS.OTP_BLOCKED(phone), '1', 'EX', BLOCK_DURATION);
      await redisService.del(REDIS_KEYS.OTP(phone));
      await redisService.del(REDIS_KEYS.OTP_ATTEMPTS(phone));
      throw AppError.tooMany('Too many incorrect OTP attempts. Phone blocked for 30 minutes.');
    }

    throw AppError.badRequest(`Invalid OTP. ${MAX_ATTEMPTS - attempts} attempts remaining.`);
  }

  // OTP verified - clean up
  await redisService.del(REDIS_KEYS.OTP(phone));
  await redisService.del(REDIS_KEYS.OTP_ATTEMPTS(phone));

  return true;
};

const initiateOTP = async (phone) => {
  await checkBlocked(phone);
  await checkRateLimit(phone);

  const otp = generateOTP();
  await storeOTP(phone, otp);
  await sendOTPToPhone(phone, otp);

  return { message: `OTP sent to ${phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}` };
};

module.exports = { initiateOTP, verifyOTP, generateOTP };
