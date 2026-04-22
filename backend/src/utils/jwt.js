'use strict';
const jwt = require('jsonwebtoken');
const AppError = require('./AppError');

const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    issuer: 'event-staffing-api',
    audience: 'event-staffing-client',
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: 'event-staffing-api',
    audience: 'event-staffing-client',
  });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      issuer: 'event-staffing-api',
      audience: 'event-staffing-client',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') throw AppError.unauthorized('Access token expired');
    if (error.name === 'JsonWebTokenError') throw AppError.unauthorized('Invalid access token');
    throw AppError.unauthorized('Token verification failed');
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'event-staffing-api',
      audience: 'event-staffing-client',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') throw AppError.unauthorized('Refresh token expired');
    throw AppError.unauthorized('Invalid refresh token');
  }
};

const generateTokenPair = (payload) => ({
  accessToken: signAccessToken(payload),
  refreshToken: signRefreshToken(payload),
});

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, generateTokenPair };
