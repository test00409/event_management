'use strict';
const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../database/models');
const AppError = require('../utils/AppError');
const { ROLES } = require('../utils/constants');

// Attach authenticated user to req.user
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Access token required'));
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  const user = await User.findByPk(decoded.id, {
    attributes: ['id', 'phone', 'name', 'role', 'is_active', 'is_blocked'],
  });

  if (!user) return next(AppError.unauthorized('User no longer exists'));
  if (!user.is_active) return next(AppError.forbidden('Account is deactivated'));
  if (user.is_blocked) return next(AppError.forbidden('Account is blocked'));

  req.user = { id: user.id, phone: user.phone, name: user.name, role: user.role };
  next();
};

// Require specific roles
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(AppError.forbidden(`Access restricted to: ${roles.join(', ')}`));
  }
  next();
};

// Shorthand guards
const requireSuperAdmin = authorize(ROLES.SUPER_ADMIN);
const requireAdmin = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);
const requireUser = authorize(ROLES.USER);
const requireAdminOnly = authorize(ROLES.ADMIN);

module.exports = { authenticate, authorize, requireSuperAdmin, requireAdmin, requireUser, requireAdminOnly };
