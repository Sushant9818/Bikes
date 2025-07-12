const BikePart = require('../models/BikePart');

// GET all parts
exports.getParts = async (req, res) => {
  const parts = await BikePart.find();
  res.json(parts);
};

// POST new part
exports.createPart = async (req, res) => {
  const part = new BikePart(req.body);
  await part.save();
  res.status(201).json(part);
};

// PUT update part
exports.updatePart = async (req, res) => {
  const part = await BikePart.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(part);
};

// DELETE part
exports.deletePart = async (req, res) => {
  await BikePart.findByIdAndDelete(req.params.id);
  res.json({ message: 'Part deleted' });
};
