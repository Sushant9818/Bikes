const express = require('express');

const router = express.Router();

const {
  getSummary,
  getRevenueDaily,
  getTopProducts,
  getLowStock,
} = require('../controllers/adminAnalyticsController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// All analytics routes are admin-only
router.use(requireAuth, requireAdmin);

router.get('/summary', getSummary);
router.get('/revenue-daily', getRevenueDaily);
router.get('/top-products', getTopProducts);
router.get('/low-stock', getLowStock);

module.exports = router;

