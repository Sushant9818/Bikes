const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bike = require('./models/Bike');
const Part = require('./models/Part');

dotenv.config();

const sampleBikes = [
  {
    name: 'Yamaha R15',
    description: 'Lightweight sportbike',
    image: 'https://via.placeholder.com/150',
  },
  {
    name: 'KTM Duke 390',
    description: 'Aggressive street bike',
    image: 'https://via.placeholder.com/150',
  },
];

const sampleParts = [
  {
    name: 'Brake Pad',
    quantity: 20,
    image: 'https://via.placeholder.com/150',
  },
  {
    name: 'Chain Kit',
    quantity: 10,
    image: 'https://via.placeholder.com/150',
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Bike.deleteMany();
    await Part.deleteMany();
    await Bike.insertMany(sampleBikes);
    await Part.insertMany(sampleParts);
    console.log('✅ Database seeded');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDB();