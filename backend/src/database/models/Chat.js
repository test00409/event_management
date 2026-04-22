'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Chat = sequelize.define(
  'Chat',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    event_id: { type: DataTypes.UUID, allowNull: false },
    hire_id: { type: DataTypes.UUID, allowNull: false },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_message_at: { type: DataTypes.DATE, allowNull: true },
    admin_unread: { type: DataTypes.INTEGER, defaultValue: 0 },
    user_unread: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: 'chats',
    indexes: [
      { fields: ['admin_id'] },
      { fields: ['user_id'] },
      { fields: ['hire_id'] },
      { unique: true, fields: ['hire_id'], name: 'unique_chat_per_hire' },
    ],
  }
);

const Message = sequelize.define(
  'Message',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    chat_id: { type: DataTypes.UUID, allowNull: false },
    sender_id: { type: DataTypes.UUID, allowNull: false },
    sender_role: { type: DataTypes.ENUM('ADMIN', 'USER', 'SUPER_ADMIN'), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    message_type: {
      type: DataTypes.ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM'),
      defaultValue: 'TEXT',
    },
    attachment_url: { type: DataTypes.STRING(500), allowNull: true },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    read_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'messages',
    indexes: [
      { fields: ['chat_id'] },
      { fields: ['sender_id'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = { Chat, Message };
