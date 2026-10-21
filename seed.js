const dotenv = require('dotenv');
dotenv.config();

const importHerbs = require('./scripts/importHerbs');

async function seedDatabase() {
  try {
    await importHerbs({ standalone: true });
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();

