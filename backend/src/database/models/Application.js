'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { APPLICATION_STATUS } = require('../../utils/constants');

const Application = sequelize.define(
  'Application',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    event_id: { type: DataTypes.UUID, allowNull: false },
    event_role_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM(...Object.values(APPLICATION_STATUS)),
      defaultValue: APPLICATION_STATUS.PENDING,
    },
    cover_note: { type: DataTypes.TEXT, allowNull: true },
    admin_notes: { type: DataTypes.TEXT, allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    // Prevent duplicate applications
  },
  {
    tableName: 'applications',
    indexes: [
      { fields: ['event_id'] },
      { fields: ['user_id'] },
      { fields: ['admin_id'] },
      { fields: ['status'] },
      { unique: true, fields: ['event_role_id', 'user_id'], name: 'unique_application' },
    ],
  }
);

module.exports = Application;
