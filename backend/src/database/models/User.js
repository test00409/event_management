'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { ROLES } = require('../../utils/constants');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    phone: { type: DataTypes.STRING(15), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: true },
    password: { type: DataTypes.STRING(255), allowNull: true },
    is_password_set: { type: DataTypes.BOOLEAN, defaultValue: false },
    role: { type: DataTypes.ENUM(...Object.values(ROLES)), defaultValue: ROLES.USER, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    is_blocked: { type: DataTypes.BOOLEAN, defaultValue: false },
    block_reason: { type: DataTypes.STRING(255), allowNull: true },
    last_login: { type: DataTypes.DATE, allowNull: true },
    // Profile fields
    bio: { type: DataTypes.TEXT, allowNull: true },
    avatar: { type: DataTypes.STRING(500), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    skills: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    portfolio_links: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    // Ratings
    average_rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0.0 },
    total_ratings: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_jobs_completed: { type: DataTypes.INTEGER, defaultValue: 0 },
    // Badges
    badges: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    // Device for push notifications
    fcm_token: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    tableName: 'users',
    indexes: [
      { fields: ['phone'] },
      { fields: ['role'] },
      { fields: ['is_active'] },
      { fields: ['location'] },
    ],
  }
);

module.exports = User;
