'use strict';
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Task, Hire, Event, User } = require('../../database/models');
const { ROLES, TASK_STATUS } = require('../../utils/constants');
const AppError = require('../../utils/AppError');
const { ApiResponse } = require('../../utils/response');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const { createTaskSchema } = require('../../validators/schemas');
const { addNotificationJob } = require('../../queues');
const { Notification } = require('../../database/models');

class TaskService {
  async create(adminId, adminRole, data) {
    const hire = await Hire.findByPk(data.hire_id, { include: [{ model: Event, as: 'event' }] });
    if (!hire) throw AppError.notFound('Hire record not found');
    if (adminRole !== ROLES.SUPER_ADMIN && hire.admin_id !== adminId) throw AppError.forbidden('Access denied');

    const task = await Task.create({
      id: uuidv4(),
      event_id: hire.event_id,
      hire_id: hire.id,
      user_id: hire.user_id,
      admin_id: adminId,
      ...data,
    });

    // Notify worker
    await Notification.create({
      id: uuidv4(), user_id: hire.user_id, type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      body: `Task: "${task.title}" has been assigned to you`,
      data: { task_id: task.id, event_id: hire.event_id },
    });
    await addNotificationJob({ userId: hire.user_id, title: 'New Task Assigned', body: task.title });

    return task;
  }

  async getEventTasks(eventId, userId, role) {
    const event = await Event.findByPk(eventId);
    if (!event) throw AppError.notFound('Event not found');
    if (role !== ROLES.SUPER_ADMIN && event.admin_id !== userId) throw AppError.forbidden('Access denied');
    return Task.findAll({
      where: { event_id: eventId },
      include: [{ model: User, as: 'assignedWorker', attributes: ['id', 'name', 'phone'] }],
      order: [['created_at', 'ASC']],
    });
  }

  async myTasks(userId) {
    return Task.findAll({
      where: { user_id: userId },
      include: [{ model: Event, as: 'event', attributes: ['id', 'title', 'venue', 'event_date'] }],
      order: [['created_at', 'DESC']],
    });
  }

  async updateStatus(taskId, userId, role, status) {
    const task = await Task.findByPk(taskId);
    if (!task) throw AppError.notFound('Task not found');
    // Worker can only update their own tasks; Admin can update any task on their event
    if (role === ROLES.USER && task.user_id !== userId) throw AppError.forbidden('Access denied');
    if (role === ROLES.ADMIN && task.admin_id !== userId) throw AppError.forbidden('Access denied');
    await task.update({ status, ...(status === TASK_STATUS.COMPLETED ? { completed_at: new Date() } : {}) });
    return task;
  }
}

const taskService = new TaskService();

router.post('/', authenticate, requireAdmin, validateBody(createTaskSchema), async (req, res) => {
  const task = await taskService.create(req.user.id, req.user.role, req.body);
  ApiResponse.created(res, task, 'Task assigned');
});

router.get('/my', authenticate, async (req, res) => {
  const tasks = await taskService.myTasks(req.user.id);
  ApiResponse.success(res, tasks);
});

router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  if (!Object.values(TASK_STATUS).includes(status)) throw AppError.badRequest('Invalid status');
  const task = await taskService.updateStatus(req.params.id, req.user.id, req.user.role, status);
  ApiResponse.success(res, task, 'Task status updated');
});

// Mounted separately for event-scoped access
const getEventTasksHandler = async (req, res) => {
  const tasks = await taskService.getEventTasks(req.params.id, req.user.id, req.user.role);
  ApiResponse.success(res, tasks);
};

module.exports = router;
module.exports.getEventTasksHandler = getEventTasksHandler;
module.exports.taskService = taskService;
