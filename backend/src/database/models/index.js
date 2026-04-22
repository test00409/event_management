'use strict';
const User = require('./User');
const Admin = require('./Admin');
const Event = require('./Event');
const EventRole = require('./EventRole');
const Application = require('./Application');
const Hire = require('./Hire');
const Task = require('./Task');
const Attendance = require('./Attendance');
const { Chat, Message } = require('./Chat');
const { Wallet, Payment, Transaction } = require('./Payment');
const Rating = require('./Rating');
const { TalentPool, Issue, Notification } = require('./Misc');

// ── User associations ──────────────────────────────────────────────────────────
User.hasOne(Admin, { foreignKey: 'user_id', as: 'adminProfile' });
Admin.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Wallet, { foreignKey: 'user_id', as: 'wallet' });
Wallet.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Application, { foreignKey: 'user_id', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'user_id', as: 'applicant' });

User.hasMany(Hire, { foreignKey: 'user_id', as: 'hires' });
Hire.belongsTo(User, { foreignKey: 'user_id', as: 'worker' });

User.hasMany(Attendance, { foreignKey: 'user_id', as: 'attendanceRecords' });
Attendance.belongsTo(User, { foreignKey: 'user_id', as: 'worker' });

User.hasMany(Task, { foreignKey: 'user_id', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'user_id', as: 'assignedWorker' });

User.hasMany(Rating, { foreignKey: 'ratee_id', as: 'ratingsReceived' });
User.hasMany(Rating, { foreignKey: 'rater_id', as: 'ratingsGiven' });
Rating.belongsTo(User, { foreignKey: 'ratee_id', as: 'ratee' });
Rating.belongsTo(User, { foreignKey: 'rater_id', as: 'rater' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'recipient' });

User.hasMany(Chat, { foreignKey: 'user_id', as: 'chatsAsWorker' });
Chat.belongsTo(User, { foreignKey: 'user_id', as: 'worker' });

// ── Event associations ─────────────────────────────────────────────────────────
Event.belongsTo(User, { foreignKey: 'admin_id', as: 'organizer' });
User.hasMany(Event, { foreignKey: 'admin_id', as: 'organizedEvents' });

Event.hasMany(EventRole, { foreignKey: 'event_id', as: 'roles', onDelete: 'CASCADE' });
EventRole.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(Application, { foreignKey: 'event_id', as: 'applications' });
Application.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(Hire, { foreignKey: 'event_id', as: 'hires' });
Hire.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(Task, { foreignKey: 'event_id', as: 'tasks' });
Task.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(Attendance, { foreignKey: 'event_id', as: 'attendanceRecords' });
Attendance.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(Chat, { foreignKey: 'event_id', as: 'chats' });
Chat.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(Payment, { foreignKey: 'event_id', as: 'payments' });
Payment.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(Rating, { foreignKey: 'event_id', as: 'ratings' });
Rating.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(Issue, { foreignKey: 'event_id', as: 'issues' });
Issue.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// ── EventRole associations ─────────────────────────────────────────────────────
EventRole.hasMany(Application, { foreignKey: 'event_role_id', as: 'applications' });
Application.belongsTo(EventRole, { foreignKey: 'event_role_id', as: 'role' });

EventRole.hasMany(Hire, { foreignKey: 'event_role_id', as: 'hires' });
Hire.belongsTo(EventRole, { foreignKey: 'event_role_id', as: 'role' });

// ── Application / Hire associations ───────────────────────────────────────────
Application.hasOne(Hire, { foreignKey: 'application_id', as: 'hire' });
Hire.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });

Hire.hasMany(Task, { foreignKey: 'hire_id', as: 'tasks' });
Task.belongsTo(Hire, { foreignKey: 'hire_id', as: 'hire' });

Hire.hasOne(Attendance, { foreignKey: 'hire_id', as: 'attendance' });
Attendance.belongsTo(Hire, { foreignKey: 'hire_id', as: 'hire' });

Hire.hasOne(Chat, { foreignKey: 'hire_id', as: 'chat' });
Chat.belongsTo(Hire, { foreignKey: 'hire_id', as: 'hire' });

Hire.hasOne(Payment, { foreignKey: 'hire_id', as: 'payment' });
Payment.belongsTo(Hire, { foreignKey: 'hire_id', as: 'hire' });

Hire.hasMany(Rating, { foreignKey: 'hire_id', as: 'ratings' });
Rating.belongsTo(Hire, { foreignKey: 'hire_id', as: 'hire' });

Hire.hasMany(Issue, { foreignKey: 'original_hire_id', as: 'issues' });
Issue.belongsTo(Hire, { foreignKey: 'original_hire_id', as: 'originalHire' });

// ── Chat / Message associations ────────────────────────────────────────────────
Chat.hasMany(Message, { foreignKey: 'chat_id', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });

Chat.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });
User.hasMany(Chat, { foreignKey: 'admin_id', as: 'chatsAsAdmin' });

// ── Payment / Transaction associations ────────────────────────────────────────
Payment.hasMany(Transaction, { foreignKey: 'payment_id', as: 'transactions' });
Transaction.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

Wallet.hasMany(Transaction, { foreignKey: 'wallet_id', as: 'transactions' });
Transaction.belongsTo(Wallet, { foreignKey: 'wallet_id', as: 'wallet' });

// ── TalentPool associations ────────────────────────────────────────────────────
TalentPool.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });
TalentPool.belongsTo(User, { foreignKey: 'user_id', as: 'worker' });
User.hasMany(TalentPool, { foreignKey: 'admin_id', as: 'talentPool' });

module.exports = {
  User, Admin, Event, EventRole, Application, Hire,
  Task, Attendance, Chat, Message,
  Wallet, Payment, Transaction,
  Rating, TalentPool, Issue, Notification,
};
