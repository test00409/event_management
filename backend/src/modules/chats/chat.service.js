'use strict';
const { v4: uuidv4 } = require('uuid');
const { Chat, Message, Hire, User } = require('../../database/models');
const { ROLES } = require('../../utils/constants');
const AppError = require('../../utils/AppError');
const { getPagination, getPaginationMeta } = require('../../utils/response');

class ChatService {
  // ── Guard: ensure caller is part of the chat ─────────────────────────────
  async _assertChatAccess(chat, userId, role) {
    if (role === ROLES.SUPER_ADMIN) return;
    if (chat.admin_id !== userId && chat.user_id !== userId) {
      throw AppError.forbidden('You are not a participant in this chat');
    }
  }

  // Admin starts a chat after hiring a worker
  async startChat(callerId, callerRole, hireId) {
    const hire = await Hire.findByPk(hireId);
    if (!hire) throw AppError.notFound('Hire record not found');

    // Only the admin who owns the hire can start
    if (callerRole !== ROLES.SUPER_ADMIN && hire.admin_id !== callerId) {
      throw AppError.forbidden('Access denied');
    }

    const [chat, created] = await Chat.findOrCreate({
      where: { hire_id: hireId },
      defaults: {
        id: uuidv4(),
        event_id: hire.event_id,
        hire_id: hireId,
        admin_id: hire.admin_id,
        user_id: hire.user_id,
      },
    });

    if (created) {
      await Message.create({
        id: uuidv4(),
        chat_id: chat.id,
        sender_id: callerId,
        sender_role: callerRole === ROLES.SUPER_ADMIN ? 'SUPER_ADMIN' : 'ADMIN',
        content: 'Chat started. Welcome to the team!',
        message_type: 'SYSTEM',
      });
    }

    return chat.reload({ include: [
      { model: User, as: 'admin', attributes: ['id', 'name'] },
      { model: User, as: 'worker', attributes: ['id', 'name'] },
    ]});
  }

  async getMessages(chatId, userId, role, query) {
    const chat = await Chat.findByPk(chatId);
    if (!chat) throw AppError.notFound('Chat not found');
    await this._assertChatAccess(chat, userId, role);

    const { page, limit, offset } = getPagination(query);
    const { count, rows } = await Message.findAndCountAll({
      where: { chat_id: chatId },
      include: [{ model: Chat, as: 'chat', attributes: ['admin_id', 'user_id'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // Mark unread messages as read
    const unreadField = role === ROLES.ADMIN ? 'admin_unread' : 'user_unread';
    await chat.update({ [unreadField]: 0 });

    return { messages: rows.reverse(), chat, pagination: getPaginationMeta(count, page, limit) };
  }

  async sendMessage(senderId, senderRole, data) {
    const { chat_id, content, message_type } = data;
    const chat = await Chat.findByPk(chat_id);
    if (!chat) throw AppError.notFound('Chat not found');
    if (!chat.is_active) throw AppError.badRequest('This chat has been closed');
    await this._assertChatAccess(chat, senderId, senderRole);

    const message = await Message.create({
      id: uuidv4(),
      chat_id,
      sender_id: senderId,
      sender_role: senderRole === ROLES.SUPER_ADMIN ? 'SUPER_ADMIN' : senderRole,
      content,
      message_type: message_type || 'TEXT',
    });

    // Increment unread counter for the other party
    const unreadField = senderRole === ROLES.ADMIN ? 'user_unread' : 'admin_unread';
    await chat.update({ last_message_at: new Date(), [unreadField]: chat[unreadField] + 1 });

    return message;
  }

  // List all chats for a user
  async myChats(userId, role) {
    const where = role === ROLES.ADMIN ? { admin_id: userId } : { user_id: userId };
    return Chat.findAll({
      where,
      include: [
        { model: User, as: 'admin', attributes: ['id', 'name'] },
        { model: User, as: 'worker', attributes: ['id', 'name'] },
        { model: Message, as: 'messages', limit: 1, order: [['created_at', 'DESC']], separate: true },
      ],
      order: [['last_message_at', 'DESC']],
    });
  }
}

module.exports = new ChatService();
