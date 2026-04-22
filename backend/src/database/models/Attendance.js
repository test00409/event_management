'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { ATTENDANCE_STATUS } = require('../../utils/constants');

const Attendance = sequelize.define(
  'Attendance',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    event_id: { type: DataTypes.UUID, allowNull: false },
    hire_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM(...Object.values(ATTENDANCE_STATUS)),
      defaultValue: ATTENDANCE_STATUS.CHECKED_IN,
    },
    check_in_time: { type: DataTypes.DATE, allowNull: true },
    check_out_time: { type: DataTypes.DATE, allowNull: true },
    check_in_method: { type: DataTypes.ENUM('QR', 'MANUAL'), defaultValue: 'QR' },
    check_in_latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    check_in_longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    qr_token: { type: DataTypes.STRING(500), allowNull: true },
    verified_by: { type: DataTypes.UUID, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'attendance',
    indexes: [
      { fields: ['event_id'] },
      { fields: ['user_id'] },
      { fields: ['hire_id'] },
      { unique: true, fields: ['event_id', 'user_id'], name: 'unique_attendance' },
    ],
  }
);

module.exports = Attendance;
