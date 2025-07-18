const express = require('express');
const router = express.Router();
const {
  getParts,
  createPart,
  updatePart,
  deletePart,
} = require('../controllers/partController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getParts); // public
router.post('/', protect, adminOnly, createPart); // admin
router.put('/:id', protect, adminOnly, updatePart); // admin
router.delete('/:id', protect, adminOnly, deletePart); // admin

module.exports = router;