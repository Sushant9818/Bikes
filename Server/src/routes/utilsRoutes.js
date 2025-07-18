const express = require('express');
const router = express.Router();
const Part = require('../models/Parts');

// TEMPORARY: Add quantity field to old parts
router.post('/fix-quantity', async (req, res) => {
  try {
    const result = await Part.updateMany(
      { quantity: { $exists: false } },
      { $set: { quantity: 0 } }
    );
    res.json({ message: 'Quantity field added to old parts', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating quantity' });
  }
});

module.exports = router;
