const mongoose = require('mongoose');
const Bike = require('../models/Bike');
const Part = require('../models/Part');

class StockError extends Error {
  constructor(message, failures) {
    super(message);
    this.name = 'StockError';
    this.failures = failures;
    this.statusCode = 409;
  }
}

async function applyStockUpdates(order, session) {
  const failures = [];

  // Ensure we always treat order.items as the single source of truth
  for (const item of order.items) {
    const Model = item.type === 'bike' ? Bike : Part;

    const result = await Model.updateOne(
      {
        _id: item.productId,
        quantity: { $gte: item.quantity },
      },
      {
        $inc: {
          quantity: -item.quantity,
          soldCount: item.quantity,
        },
      },
      { session },
    );

    if (!result.matchedCount || !result.modifiedCount) {
      failures.push({
        productId: item.productId,
        type: item.type,
        reason: `Insufficient stock for ${item.name}`,
      });
    }
  }

  if (failures.length > 0) {
    throw new StockError('Insufficient stock for one or more items', failures);
  }
}

/**
 * Deduct stock when an order is being marked as PAID.
 * Tries to use MongoDB transactions; falls back to per-document
 * conditional updates when transactions are not supported.
 */
async function deductStockForOrder(order) {
  let session;
  try {
    session = await mongoose.startSession();
    let useTransaction = true;

    try {
      await session.withTransaction(async () => {
        await applyStockUpdates(order, session);
        order.status = 'PAID';
        order.stockFailureReason = [];
        await order.save({ session });
      });
    } catch (err) {
      // If transactions are not supported (e.g. standalone Mongo), fall back
      if (err && /Transaction numbers are only allowed on a replica set member or mongos/i.test(err.message)) {
        useTransaction = false;
      } else if (err instanceof StockError) {
        // Stock failure within a transaction
        order.status = 'STOCK_FAILED';
        order.stockFailureReason = err.failures;
        await order.save({ session });
        throw err;
      } else {
        throw err;
      }
    } finally {
      session.endSession();
    }

    if (!useTransaction) {
      // Fallback: still safe per-document using conditional updates
      try {
        await applyStockUpdates(order, null);
        order.status = 'PAID';
        order.stockFailureReason = [];
        await order.save();
      } catch (err) {
        if (err instanceof StockError) {
          order.status = 'STOCK_FAILED';
          order.stockFailureReason = err.failures;
          await order.save();
        }
        throw err;
      }
    }
  } catch (err) {
    // Surface stock problems; caller decides what to do with errors
    throw err;
  }
}

async function validateCartItems(cartItems) {
  const results = [];

  for (const item of cartItems) {
    const Model = item.type === 'bike' ? Bike : Part;
    const doc = await Model.findById(item.productId).lean();
    if (!doc) {
      results.push({
        productId: item.productId,
        type: item.type,
        requested: item.quantity,
        available: 0,
        ok: false,
        reason: 'Product not found',
      });
      continue;
    }

    const ok = doc.quantity >= item.quantity;

    results.push({
      productId: item.productId,
      type: item.type,
      requested: item.quantity,
      available: doc.quantity,
      ok,
      reason: ok ? null : 'Insufficient stock',
    });
  }

  return results;
}

module.exports = {
  deductStockForOrder,
  validateCartItems,
  StockError,
};

