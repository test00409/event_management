'use strict';
require('dotenv').config();

const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const { initQueues } = require('./src/queues');
const { seedDatabase } = require('./src/database/seeder');
const logger = require('./src/utils/logger');

const PORT = parseInt(process.env.PORT) || 3000;

const start = async () => {
  try {
    // 1. Connect DB (exits on failure)
    await connectDB();

    // 2. Connect Redis (non-fatal — falls back to in-memory)
    await connectRedis();

    // 3. Initialize queues (non-fatal — falls back to sync)
    await initQueues();

    // 4. Seed initial data
    await seedDatabase();

    // 5. Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info(`  🚀 Event Staffing API`);
      logger.info(`  ► Environment : ${process.env.NODE_ENV || 'development'}`);
      logger.info(`  ► Port        : ${PORT}`);
      logger.info(`  ► Base URL    : http://localhost:${PORT}/api/v1`);
      logger.info(`  ► Health      : http://localhost:${PORT}/health`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    // ── Graceful shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        try {
          const { sequelize } = require('./src/config/database');
          await sequelize.close();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown:', err);
          process.exit(1);
        }
      });

      // Force kill after 10s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
