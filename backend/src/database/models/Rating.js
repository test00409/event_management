'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Rating = sequelize.define(
  'Rating',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    event_id: { type: DataTypes.UUID, allowNull: false },
    hire_id: { type: DataTypes.UUID, allowNull: false },
    rater_id: { type: DataTypes.UUID, allowNull: false },
    ratee_id: { type: DataTypes.UUID, allowNull: false },
    rater_role: { type: DataTypes.ENUM('ADMIN', 'USER'), allowNull: false },
    stars: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 1, max: 5 } },
    review: { type: DataTypes.TEXT, allowNull: true },
    aspects: { type: DataTypes.JSON, allowNull: true }, // { punctuality: 5, skill: 4, ... }
  },
  {
    tableName: 'ratings',
    indexes: [
      { fields: ['event_id'] },
      { fields: ['ratee_id'] },
      { fields: ['rater_id'] },
      { unique: true, fields: ['hire_id', 'rater_id'], name: 'unique_rating_per_hire' },
    ],
  }
);

module.exports = Rating;
