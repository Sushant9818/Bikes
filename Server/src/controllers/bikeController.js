const Bike = require('../models/Bike');

// @desc Get all bikes (public or filtered)
const getBikes = async (req, res) => {
  const { q } = req.query;
  const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
  const bikes = await Bike.find(filter);
  res.json(bikes);
};

// @desc Create a new bike (admin only)
const createBike = async (req, res) => {
  const { name, description, image } = req.body;

  const bike = new Bike({ name, description, image });
  const created = await bike.save();
  res.status(201).json(created);
};

// @desc Update a bike by ID
const updateBike = async (req, res) => {
  const { name, description, image } = req.body;
  const bike = await Bike.findById(req.params.id);

  if (!bike) return res.status(404).json({ message: 'Bike not found' });

  bike.name = name || bike.name;
  bike.description = description || bike.description;
  bike.image = image || bike.image;

  const updated = await bike.save();
  res.json(updated);
};

// @desc Delete a bike
const deleteBike = async (req, res) => {
  const bike = await Bike.findById(req.params.id);
  if (!bike) return res.status(404).json({ message: 'Bike not found' });

  await bike.deleteOne();
  res.json({ message: 'Bike deleted' });
};

module.exports = {
  getBikes,
  createBike,
  updateBike,
  deleteBike,
};