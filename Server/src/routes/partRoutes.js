const express = require('express');
const router = express.Router();
const {
  getParts,
  createPart,
  updatePart,
  deletePart,
} = require('../controllers/partController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @desc   Get all parts (public)
// @route  GET /api/parts
router.get('/', getParts);

// @desc   Create a new part (admin only)
// @route  POST /api/parts
router.post('/', protect, adminOnly, createPart);

// @desc   Update a part by ID (admin only)
// @route  PUT /api/parts/:id
router.put('/:id', protect, adminOnly, updatePart);

// @desc   Delete a part by ID (admin only)
// @route  DELETE /api/parts/:id
router.delete('/:id', protect, adminOnly, deletePart);

module.exports = router;