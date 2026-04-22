'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { TASK_STATUS } = require('../../utils/constants');

const Task = sequelize.define(
  'Task',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    event_id: { type: DataTypes.UUID, allowNull: false },
    hire_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    location: { type: DataTypes.STRING(300), allowNull: true },
    start_time: { type: DataTypes.DATE, allowNull: true },
    end_time: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM(...Object.values(TASK_STATUS)),
      defaultValue: TASK_STATUS.ASSIGNED,
    },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    priority: { type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'), defaultValue: 'MEDIUM' },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'tasks',
    indexes: [
      { fields: ['event_id'] },
      { fields: ['user_id'] },
      { fields: ['hire_id'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = Task;
