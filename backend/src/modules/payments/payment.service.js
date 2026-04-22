'use strict';
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../../config/database');
const { Wallet, Payment, Transaction, Hire, User, Notification } = require('../../database/models');
const { PAYMENT_STATUS, TRANSACTION_TYPE, ROLES } = require('../../utils/constants');
const AppError = require('../../utils/AppError');
const { getPagination, getPaginationMeta } = require('../../utils/response');
const { addNotificationJob } = require('../../queues');
const logger = require('../../utils/logger');

class PaymentService {
  // Called by queue worker after T+1 delay
  async settlePayment(paymentId) {
    const t = await sequelize.transaction();
    try {
      const payment = await Payment.findByPk(paymentId, { transaction: t });
      if (!payment || payment.status !== PAYMENT_STATUS.PENDING) {
        await t.rollback();
        return;
      }

      const wallet = await Wallet.findOne({ where: { user_id: payment.payee_id }, transaction: t, lock: true });
      if (!wallet) {
        await t.rollback();
        logger.error(`No wallet found for user ${payment.payee_id}`);
        return;
      }

      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = balanceBefore + parseFloat(payment.amount);

      await wallet.update({
        balance: balanceAfter,
        total_earned: parseFloat(wallet.total_earned) + parseFloat(payment.amount),
        pending_amount: Math.max(0, parseFloat(wallet.pending_amount) - parseFloat(payment.amount)),
      }, { transaction: t });

      await Transaction.create({
        id: uuidv4(),
        wallet_id: wallet.id,
        payment_id: payment.id,
        type: TRANSACTION_TYPE.CREDIT,
        amount: payment.amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: `Payment for event work`,
        reference: payment.transaction_id,
      }, { transaction: t });

      await payment.update({
        status: PAYMENT_STATUS.COMPLETED,
        settled_at: new Date(),
      }, { transaction: t });

      await t.commit();
      logger.info(`Payment ${paymentId} settled: ₹${payment.amount} → user ${payment.payee_id}`);

      // Notify worker
      await Notification.create({
        id: uuidv4(),
        user_id: payment.payee_id,
        type: 'PAYMENT_RELEASED',
        title: 'Payment Received!',
        body: `₹${payment.amount} has been credited to your wallet`,
        data: { payment_id: paymentId, amount: payment.amount },
      });
      await addNotificationJob({
        userId: payment.payee_id,
        title: 'Payment Received!',
        body: `₹${payment.amount} credited to your wallet`,
      });
    } catch (err) {
      await t.rollback();
      logger.error(`Payment settlement failed for ${paymentId}:`, err);
      throw err;
    }
  }

  // Create a pending payment when work is marked done
  async createPendingPayment(hireId, adminId) {
    const hire = await Hire.findByPk(hireId);
    if (!hire) throw AppError.notFound('Hire not found');
    if (hire.admin_id !== adminId) throw AppError.forbidden('Access denied');
    if (!hire.work_marked_done) throw AppError.badRequest('Work must be marked done first');
    if (hire.payment_released) throw AppError.conflict('Payment already processed for this hire');

    const existing = await Payment.findOne({ where: { hire_id: hireId } });
    if (existing) return existing;

    const settlementHours = parseInt(process.env.PAYMENT_SETTLEMENT_HOURS) || 24;
    const settlementDue = new Date(Date.now() + settlementHours * 3600 * 1000);

    const payment = await Payment.create({
      id: uuidv4(),
      hire_id: hireId,
      event_id: hire.event_id,
      payer_id: hire.admin_id,
      payee_id: hire.user_id,
      amount: hire.agreed_pay,
      status: PAYMENT_STATUS.PENDING,
      transaction_id: `TXN-${uuidv4().toUpperCase().slice(0, 12)}`,
      settlement_due_at: settlementDue,
    });

    // Mark pending in wallet
    const wallet = await Wallet.findOne({ where: { user_id: hire.user_id } });
    if (wallet) {
      await wallet.update({ pending_amount: parseFloat(wallet.pending_amount) + parseFloat(hire.agreed_pay) });
    }

    await hire.update({ payment_released: true, payment_released_at: new Date() });
    return payment;
  }

  // Worker: get wallet
  async getWallet(userId) {
    const wallet = await Wallet.findOne({ where: { user_id: userId } });
    if (!wallet) throw AppError.notFound('Wallet not found');
    return wallet;
  }

  // Worker: get earnings history
  async getEarnings(userId, query) {
    const { page, limit, offset } = getPagination(query);
    const wallet = await Wallet.findOne({ where: { user_id: userId } });
    if (!wallet) throw AppError.notFound('Wallet not found');

    const { count, rows } = await Transaction.findAndCountAll({
      where: { wallet_id: wallet.id, type: TRANSACTION_TYPE.CREDIT },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      wallet: { balance: wallet.balance, total_earned: wallet.total_earned, pending_amount: wallet.pending_amount },
      transactions: rows,
      pagination: getPaginationMeta(count, page, limit),
    };
  }

  // Worker: withdraw
  async withdraw(userId, amount, notes) {
    const t = await sequelize.transaction();
    try {
      const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t, lock: true });
      if (!wallet) throw AppError.notFound('Wallet not found');
      if (wallet.is_frozen) throw AppError.forbidden('Wallet is frozen');
      if (parseFloat(wallet.balance) < amount) throw AppError.badRequest('Insufficient balance');

      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = balanceBefore - amount;

      await wallet.update({
        balance: balanceAfter,
        total_withdrawn: parseFloat(wallet.total_withdrawn) + amount,
      }, { transaction: t });

      const txn = await Transaction.create({
        id: uuidv4(),
        wallet_id: wallet.id,
        type: TRANSACTION_TYPE.DEBIT,
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: notes || 'Withdrawal request',
        reference: `WD-${Date.now()}`,
      }, { transaction: t });

      await t.commit();
      return { transaction: txn, new_balance: balanceAfter };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // Super Admin: all payments
  async getAllPayments(query) {
    const { page, limit, offset } = getPagination(query);
    const where = {};
    if (query.status) where.status = query.status;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: User, as: 'payer', foreignKey: 'payer_id', attributes: ['id', 'name', 'phone'] },
        { model: User, as: 'payee', foreignKey: 'payee_id', attributes: ['id', 'name', 'phone'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { payments: rows, pagination: getPaginationMeta(count, page, limit) };
  }
}

const paymentService = new PaymentService();
module.exports = { paymentService };
