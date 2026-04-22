'use strict';
const { v4: uuidv4 } = require('uuid');
const { User, Admin, Event, EventRole, Wallet } = require('./models');
const { ROLES, VERIFICATION_STATUS, EVENT_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');

    // ── Super Admin ──────────────────────────────────────────────────────
    const [superAdmin, saCreated] = await User.findOrCreate({
      where: { phone: process.env.SUPER_ADMIN_PHONE || '9999999999' },
      defaults: {
        id: uuidv4(),
        name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
        role: ROLES.SUPER_ADMIN,
        is_active: true,
      },
    });
    if (saCreated) logger.info(`Super Admin created: phone=${superAdmin.phone}`);

    // ── Demo Admin ──────────────────────────────────────────────────────
    const [adminUser, adminCreated] = await User.findOrCreate({
      where: { phone: '8888888888' },
      defaults: {
        id: uuidv4(),
        name: 'Demo Event Manager',
        role: ROLES.ADMIN,
        is_active: true,
      },
    });

    const [adminProfile] = await Admin.findOrCreate({
      where: { user_id: adminUser.id },
      defaults: {
        id: uuidv4(),
        user_id: adminUser.id,
        company_name: 'EventPro Solutions Pvt Ltd',
        company_type: 'Event Management',
        contact_person: 'Demo Manager',
        contact_email: 'demo@eventpro.com',
        verification_status: VERIFICATION_STATUS.APPROVED,
        is_verified: true,
        verified_at: new Date(),
        verified_by: superAdmin.id,
      },
    });
    if (adminCreated) logger.info(`Demo Admin created: phone=8888888888`);

    // ── Demo Worker ──────────────────────────────────────────────────────
    const [workerUser, workerCreated] = await User.findOrCreate({
      where: { phone: '7777777777' },
      defaults: {
        id: uuidv4(),
        name: 'Demo Worker',
        role: ROLES.USER,
        skills: ['Photography', 'Event Setup', 'Customer Service'],
        location: 'Mumbai, Maharashtra',
        bio: 'Experienced event worker with 3+ years of experience.',
        is_active: true,
      },
    });

    await Wallet.findOrCreate({
      where: { user_id: workerUser.id },
      defaults: { id: uuidv4(), user_id: workerUser.id, balance: 500.00 },
    });
    if (workerCreated) logger.info(`Demo Worker created: phone=7777777777`);

    // ── Demo Event ──────────────────────────────────────────────────────
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);

    const [demoEvent, eventCreated] = await Event.findOrCreate({
      where: { title: 'Annual Tech Conference 2025', admin_id: adminUser.id },
      defaults: {
        id: uuidv4(),
        admin_id: adminUser.id,
        title: 'Annual Tech Conference 2025',
        description: 'A premier technology conference bringing together industry leaders.',
        venue: 'Bombay Exhibition Centre, Mumbai',
        city: 'Mumbai',
        event_date: tomorrow.toISOString().split('T')[0],
        start_time: '09:00:00',
        end_time: '18:00:00',
        budget: 50000.00,
        status: EVENT_STATUS.PUBLISHED,
        published_at: new Date(),
        required_skills: ['Customer Service', 'Technical Support', 'Photography'],
        total_slots: 10,
      },
    });

    if (eventCreated) {
      await EventRole.bulkCreate([
        {
          id: uuidv4(), event_id: demoEvent.id,
          role_name: 'Photographer', description: 'Cover all sessions and networking',
          slots: 2, pay_per_slot: 3000.00, required_skills: ['Photography'],
        },
        {
          id: uuidv4(), event_id: demoEvent.id,
          role_name: 'Registration Desk', description: 'Manage attendee check-in',
          slots: 4, pay_per_slot: 1500.00, required_skills: ['Customer Service'],
        },
        {
          id: uuidv4(), event_id: demoEvent.id,
          role_name: 'Technical Support', description: 'AV and technical assistance',
          slots: 4, pay_per_slot: 2000.00, required_skills: ['Technical Support'],
        },
      ]);
      logger.info('Demo Event and Roles created');
    }

    logger.info('✅ Database seeding completed');
    logger.info('─────────────────────────────────────────────');
    logger.info('Test Credentials:');
    logger.info(`  SUPER_ADMIN  → phone: ${process.env.SUPER_ADMIN_PHONE || '9999999999'}`);
    logger.info('  ADMIN        → phone: 8888888888');
    logger.info('  WORKER       → phone: 7777777777');
    logger.info('  OTP for all  → check server logs after /auth/send-otp');
    logger.info('─────────────────────────────────────────────');
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  }
};

module.exports = { seedDatabase };
