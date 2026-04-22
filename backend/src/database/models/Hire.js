'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Hire = sequelize.define(
  'Hire',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    application_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    event_id: { type: DataTypes.UUID, allowNull: false },
    event_role_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    agreed_pay: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    is_replacement: { type: DataTypes.BOOLEAN, defaultValue: false },
    replaced_hire_id: { type: DataTypes.UUID, allowNull: true },
    work_marked_done: { type: DataTypes.BOOLEAN, defaultValue: false },
    work_done_at: { type: DataTypes.DATE, allowNull: true },
    payment_released: { type: DataTypes.BOOLEAN, defaultValue: false },
    payment_released_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'hires',
    indexes: [
      { fields: ['event_id'] },
      { fields: ['user_id'] },
      { fields: ['admin_id'] },
      { fields: ['application_id'] },
    ],
  }
);

module.exports = Hire;
