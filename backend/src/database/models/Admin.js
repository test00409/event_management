'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { VERIFICATION_STATUS } = require('../../utils/constants');

const Admin = sequelize.define(
  'Admin',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    company_name: { type: DataTypes.STRING(200), allowNull: false },
    company_type: { type: DataTypes.STRING(100), allowNull: true },
    company_address: { type: DataTypes.TEXT, allowNull: true },
    company_website: { type: DataTypes.STRING(300), allowNull: true },
    business_proof_url: { type: DataTypes.STRING(500), allowNull: true },
    gstin: { type: DataTypes.STRING(20), allowNull: true },
    contact_person: { type: DataTypes.STRING(100), allowNull: false },
    contact_email: { type: DataTypes.STRING(200), allowNull: true },
    verification_status: {
      type: DataTypes.ENUM(...Object.values(VERIFICATION_STATUS)),
      defaultValue: VERIFICATION_STATUS.PENDING,
    },
    verification_notes: { type: DataTypes.TEXT, allowNull: true },
    verified_at: { type: DataTypes.DATE, allowNull: true },
    verified_by: { type: DataTypes.UUID, allowNull: true },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    total_events: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_spent: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0 },
    average_rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0.0 },
  },
  {
    tableName: 'admins',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['verification_status'] },
      { fields: ['is_verified'] },
    ],
  }
);

module.exports = Admin;
