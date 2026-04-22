'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { PAYMENT_STATUS, TRANSACTION_TYPE } = require('../../utils/constants');

const Wallet = sequelize.define(
  'Wallet',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0 },
    total_earned: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0 },
    total_withdrawn: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0 },
    pending_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0 },
    is_frozen: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: 'wallets',
    indexes: [{ fields: ['user_id'] }],
  }
);

const Payment = sequelize.define(
  'Payment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    hire_id: { type: DataTypes.UUID, allowNull: false },
    event_id: { type: DataTypes.UUID, allowNull: false },
    payer_id: { type: DataTypes.UUID, allowNull: false },   // admin
    payee_id: { type: DataTypes.UUID, allowNull: false },   // user
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
      defaultValue: PAYMENT_STATUS.PENDING,
    },
    transaction_id: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    settlement_due_at: { type: DataTypes.DATE, allowNull: true },
    settled_at: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    failure_reason: { type: DataTypes.STRING(300), allowNull: true },
  },
  {
    tableName: 'payments',
    indexes: [
      { fields: ['hire_id'] },
      { fields: ['payer_id'] },
      { fields: ['payee_id'] },
      { fields: ['status'] },
      { fields: ['settlement_due_at'] },
    ],
  }
);

const Transaction = sequelize.define(
  'Transaction',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    wallet_id: { type: DataTypes.UUID, allowNull: false },
    payment_id: { type: DataTypes.UUID, allowNull: true },
    type: { type: DataTypes.ENUM(...Object.values(TRANSACTION_TYPE)), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    balance_before: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    balance_after: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    description: { type: DataTypes.STRING(300), allowNull: true },
    reference: { type: DataTypes.STRING(200), allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: 'transactions',
    indexes: [
      { fields: ['wallet_id'] },
      { fields: ['payment_id'] },
      { fields: ['type'] },
    ],
  }
);

module.exports = { Wallet, Payment, Transaction };
