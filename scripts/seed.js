require('dotenv').config();
const mongoose = require('mongoose');
const { dbConfig } = require('../src/config/database.config');
const User = require('../src/models/User.model');
const Meeting = require('../src/models/Meeting.model');
const logger = require('../src/utils/logger');

const seed = async () => {
  await mongoose.connect(dbConfig.uri);
  logger.info('Connected – seeding...');

  await Promise.all([User.deleteMany({}), Meeting.deleteMany({})]);

  const [admin] = await User.create([
    { name: 'Admin User', email: 'admin@hintro.ai', password: 'Admin1234!', role: 'admin' },
    { name: 'Demo User', email: 'demo@hintro.ai', password: 'Demo1234!' },
  ]);

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await Meeting.create([
    {
      title: 'Q1 Planning Session',
      owner: admin._id,
      scheduledAt: tomorrow,
      duration: 60,
      status: 'scheduled',
      participants: [{ name: 'Admin User', email: 'admin@hintro.ai', role: 'host' }],
      tags: ['planning', 'q1'],
    },
  ]);

  logger.info('Seed complete');
  await mongoose.disconnect();
};

seed().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
