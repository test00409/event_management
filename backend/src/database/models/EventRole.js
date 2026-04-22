'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const EventRole = sequelize.define(
  'EventRole',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    event_id: { type: DataTypes.UUID, allowNull: false },
    role_name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    slots: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    filled_slots: { type: DataTypes.INTEGER, defaultValue: 0 },
    pay_per_slot: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    required_skills: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    start_time: { type: DataTypes.TIME, allowNull: true },
    end_time: { type: DataTypes.TIME, allowNull: true },
    location_notes: { type: DataTypes.STRING(300), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'event_roles',
    indexes: [{ fields: ['event_id'] }],
  }
);

module.exports = EventRole;
