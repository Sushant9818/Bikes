const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Bike = require('../models/Bike');
const Part = require('../models/Part');

function parseDateRange(req) {
  const { from, to } = req.query;
  if (!from || !to) {
    const err = new Error('Query params "from" and "to" are required (YYYY-MM-DD)');
    err.statusCode = 400;
    throw err;
  }
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    const err = new Error('Invalid date format for "from" or "to"');
    err.statusCode = 400;
    throw err;
  }
  return { fromDate, toDate };
}

// GET /api/admin/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getSummary = async (req, res, next) => {
  try {
    const { fromDate, toDate } = parseDateRange(req);

    const [ordersAgg, newCustomersCount] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: fromDate, $lte: toDate },
            status: { $in: ['PAID', 'FAILED', 'STOCK_FAILED'] },
          },
        },
        {
          $facet: {
            paid: [
              { $match: { status: 'PAID' } },
              {
                $group: {
                  _id: null,
                  totalRevenue: { $sum: '$total' },
                  totalOrders: { $sum: 1 },
                  totalUnitsSold: { $sum: { $sum: '$items.quantity' } },
                },
              },
            ],
            failed: [
              { $match: { status: { $in: ['FAILED', 'STOCK_FAILED'] } } },
              { $group: { _id: null, failedOrders: { $sum: 1 } } },
            ],
          },
        },
      ]),
      User.countDocuments({
        role: 'CLIENT',
        createdAt: { $gte: fromDate, $lte: toDate },
      }),
    ]);

    const facet = ordersAgg[0] || { paid: [], failed: [] };
    const paid = facet.paid[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      totalUnitsSold: 0,
    };
    const failed = facet.failed[0] || { failedOrders: 0 };

    const totalRevenue = paid.totalRevenue || 0;
    const totalOrders = paid.totalOrders || 0;
    const totalUnitsSold = paid.totalUnitsSold || 0;
    const failedOrders = failed.failedOrders || 0;

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const denominator = totalOrders + failedOrders;
    const conversionRate = denominator > 0 ? totalOrders / denominator : 0;

    return res.status(200).json({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalUnitsSold,
      newCustomers: newCustomersCount,
      conversionRate,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/analytics/revenue-daily?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getRevenueDaily = async (req, res, next) => {
  try {
    const { fromDate, toDate } = parseDateRange(req);

    const results = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
          status: 'PAID',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$total' },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1,
        },
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
            },
          },
          revenue: 1,
        },
      },
    ]);

    return res.status(200).json(
      results.map((r) => ({
        date: r.date,
        revenue: r.revenue,
      })),
    );
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/analytics/top-products?from&to&limit=10
exports.getTopProducts = async (req, res, next) => {
  try {
    const { fromDate, toDate } = parseDateRange(req);
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);

    const agg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
          status: 'PAID',
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            productId: '$items.productId',
            type: '$items.type',
          },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      {
        $sort: {
          unitsSold: -1,
          revenue: -1,
        },
      },
      { $limit: limit },
    ]);

    // Enrich with product details and remaining stock
    const results = [];
    for (const row of agg) {
      const { productId, type } = row._id;
      const Model = type === 'bike' ? Bike : Part;
      const doc = await Model.findById(productId).lean();
      if (!doc) continue;

      results.push({
        productId: productId.toString(),
        name: doc.name,
        type,
        unitsSold: row.unitsSold,
        revenue: row.revenue,
        remainingStock: doc.quantity,
      });
    }

    return res.status(200).json(results);
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/analytics/low-stock?threshold=5
exports.getLowStock = async (req, res, next) => {
  try {
    const threshold = Number.isNaN(parseInt(req.query.threshold, 10))
      ? 5
      : parseInt(req.query.threshold, 10);

    const [bikes, parts] = await Promise.all([
      Bike.aggregate([
        { $match: { quantity: { $lte: threshold } } },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            name: 1,
            type: { $literal: 'bike' },
            quantity: 1,
            soldCount: 1,
            price: 1,
          },
        },
      ]),
      Part.aggregate([
        { $match: { quantity: { $lte: threshold } } },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            name: 1,
            type: { $literal: 'part' },
            quantity: 1,
            soldCount: 1,
            price: 1,
          },
        },
      ]),
    ]);

    return res.status(200).json([...bikes, ...parts]);
  } catch (err) {
    return next(err);
  }
};

