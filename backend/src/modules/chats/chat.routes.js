'use strict';
const router = require('express').Router();
const chatService = require('./chat.service');
const { ApiResponse } = require('../../utils/response');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const { validateBody, validateQuery } = require('../../middleware/validate');
const { startChatSchema, sendMessageSchema } = require('../../validators/schemas');
const Joi = require('joi');

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(30),
});

// Start chat (admin-initiated after hire)
router.post('/start', authenticate, requireAdmin, validateBody(startChatSchema), async (req, res) => {
  const chat = await chatService.startChat(req.user.id, req.user.role, req.body.hire_id);
  ApiResponse.created(res, chat, 'Chat started');
});

// My chats (both admin and worker)
router.get('/my', authenticate, async (req, res) => {
  const chats = await chatService.myChats(req.user.id, req.user.role);
  ApiResponse.success(res, chats);
});

// Get messages in a chat
router.get('/:id/messages', authenticate, validateQuery(paginationSchema), async (req, res) => {
  const result = await chatService.getMessages(req.params.id, req.user.id, req.user.role, req.query);
  ApiResponse.paginated(res, result.messages, result.pagination);
});

// Send a message
router.post('/messages', authenticate, validateBody(sendMessageSchema), async (req, res) => {
  const message = await chatService.sendMessage(req.user.id, req.user.role, req.body);
  ApiResponse.created(res, message, 'Message sent');
});

module.exports = router;
