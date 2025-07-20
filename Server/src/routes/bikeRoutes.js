const express = require('express');
const router = express.Router();
const {
  getBikes,
  createBike,
  updateBike,
  deleteBike,
} = require('../controllers/bikeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public
router.get('/', getBikes);

// Admin only
router.post('/', protect, adminOnly, createBike);
router.put('/:id', protect, adminOnly, updateBike);
router.delete('/:id', protect, adminOnly, deleteBike);

module.exports = router;
