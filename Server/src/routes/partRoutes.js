const express = require('express');
const router = express.Router();
const {
  getParts,
  createPart,
  updatePart,
  deletePart
} = require('../controllers/partController');

router.get('/', getParts);    // optionally: add authMiddleware here
router.post('/', protect, createPart);
router.put('/:id', protect, updatePart);
router.delete('/:id', protect, deletePart);

module.exports = router;
