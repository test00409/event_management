'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { ISSUE_TYPE } = require('../../utils/constants');

const TalentPool = sequelize.define(
  'TalentPool',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  },
  {
    tableName: 'talent_pool',
    indexes: [
      { fields: ['admin_id'] },
      { unique: true, fields: ['admin_id', 'user_id'], name: 'unique_talent_entry' },
    ],
  }
);

const Issue = sequelize.define(
  'Issue',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    event_id: { type: DataTypes.UUID, allowNull: false },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    reported_user_id: { type: DataTypes.UUID, allowNull: false },
    original_hire_id: { type: DataTypes.UUID, allowNull: false },
    replacement_hire_id: { type: DataTypes.UUID, allowNull: true },
    issue_type: { type: DataTypes.ENUM(...Object.values(ISSUE_TYPE)), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
    resolved_at: { type: DataTypes.DATE, allowNull: true },
    resolution_notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'issues',
    indexes: [
      { fields: ['event_id'] },
      { fields: ['admin_id'] },
      { fields: ['reported_user_id'] },
    ],
  }
);

const Notification = sequelize.define(
  'Notification',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING(100), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    data: { type: DataTypes.JSON, allowNull: true },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    read_at: { type: DataTypes.DATE, allowNull: true },
    sent_via_push: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: 'notifications',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = { TalentPool, Issue, Notification };
