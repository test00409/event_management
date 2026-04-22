'use strict';
const logger = require('../utils/logger');

let Queue, Worker, QueueEvents;
let notificationQueue, paymentQueue;
let notificationWorker, paymentWorker;

// Lazy-load BullMQ only if Redis is available
const initQueues = async () => {
  try {
    const bullmq = require('bullmq');
    Queue = bullmq.Queue;
    Worker = bullmq.Worker;
    QueueEvents = bullmq.QueueEvents;

    const connection = {
      host: process.env.QUEUE_REDIS_HOST || 'localhost',
      port: parseInt(process.env.QUEUE_REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 3000,
    };

    notificationQueue = new Queue('notifications', { connection });
    paymentQueue = new Queue('payments', { connection });

    notificationWorker = new Worker(
      'notifications',
      async (job) => {
        logger.info(`[NOTIFICATION QUEUE] Processing job ${job.id}:`, job.data);
        // In production: send FCM push notification here
        // const { userId, title, body, data } = job.data;
        // await fcmService.send(userId, title, body, data);
      },
      { connection, concurrency: 5 }
    );

    paymentWorker = new Worker(
      'payments',
      async (job) => {
        logger.info(`[PAYMENT QUEUE] Processing job ${job.id}:`, job.data);
        // T+1 settlement logic handled via scheduled jobs
        const { paymentService } = require('../modules/payments/payment.service');
        if (job.name === 'settle_payment') {
          await paymentService.settlePayment(job.data.paymentId);
        }
      },
      { connection, concurrency: 2 }
    );

    notificationWorker.on('failed', (job, err) => {
      logger.error(`Notification job ${job?.id} failed:`, err.message);
    });

    paymentWorker.on('failed', (job, err) => {
      logger.error(`Payment job ${job?.id} failed:`, err.message);
    });

    logger.info('BullMQ queues initialized');
  } catch (err) {
    logger.warn('BullMQ unavailable, using synchronous fallback:', err.message);
    notificationQueue = null;
    paymentQueue = null;
  }
};

const addNotificationJob = async (data, options = {}) => {
  try {
    if (notificationQueue) {
      await notificationQueue.add('send_notification', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        ...options,
      });
    } else {
      // Synchronous fallback - just log
      logger.info('[NOTIFICATION SYNC]', data);
    }
  } catch (err) {
    logger.error('Failed to queue notification:', err.message);
  }
};

const addPaymentJob = async (data, delayMs = 0) => {
  try {
    if (paymentQueue) {
      await paymentQueue.add('settle_payment', data, {
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } else {
      logger.info('[PAYMENT QUEUE SYNC] Scheduled payment settlement:', data);
    }
  } catch (err) {
    logger.error('Failed to queue payment:', err.message);
  }
};

module.exports = { initQueues, addNotificationJob, addPaymentJob };
