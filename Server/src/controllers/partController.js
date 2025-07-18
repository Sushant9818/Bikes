const Part = require('../models/Parts');

// @desc    Get all parts (public)
const getParts = async (req, res) => {
  try {
    const parts = await Part.find();
    res.json(parts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new part (admin only)
const createPart = async (req, res) => {
  const { name, imageUrl, category, price,quantity, inStock } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  try {
    const newPart = new Part({ name, imageUrl, category, price,quantity, inStock });
    await newPart.save();
    res.status(201).json(newPart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create part' });
  }
};

// @desc    Update part (admin only)
const updatePart = async (req, res) => {
  try {
    const updated = await Part.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Part not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update part' });
  }
};

// @desc    Delete part (admin only)
const deletePart = async (req, res) => {
  try {
    const deleted = await Part.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Part not found' });
    res.json({ message: 'Part deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete part' });
  }
};

module.exports = {
  getParts,
  createPart,
  updatePart,
  deletePart,
};