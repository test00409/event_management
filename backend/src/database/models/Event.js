'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { EVENT_STATUS } = require('../../utils/constants');

const Event = sequelize.define(
  'Event',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    venue: { type: DataTypes.STRING(300), allowNull: false },
    venue_latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    venue_longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    event_date: { type: DataTypes.DATEONLY, allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: true },
    budget: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM(...Object.values(EVENT_STATUS)),
      defaultValue: EVENT_STATUS.DRAFT,
    },
    published_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    required_skills: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    total_slots: { type: DataTypes.INTEGER, defaultValue: 0 },
    filled_slots: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_cost: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0 },
    qr_code: { type: DataTypes.STRING(500), allowNull: true },
    // Report
    report_generated: { type: DataTypes.BOOLEAN, defaultValue: false },
    report_url: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    tableName: 'events',
    indexes: [
      { fields: ['admin_id'] },
      { fields: ['status'] },
      { fields: ['event_date'] },
      { fields: ['city'] },
    ],
  }
);

module.exports = Event;
