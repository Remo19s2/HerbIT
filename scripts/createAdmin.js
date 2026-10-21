const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');

function getNormalizedMongoUri() {
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/herbal_garden';
  if (uri.includes('ssl=true')) {
    uri = uri.replace('ssl=true', 'tls=true');
  }
  return uri;
}

async function createAdmin() {
  // Read from CLI arguments or environment variables
  const args = process.argv.slice(2);
  const name = args[0] || process.env.ADMIN_NAME || 'Herbal Garden Administrator';
  const email = (args[1] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = args[2] || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('====================================================');
    console.error('❌ Missing required administrator credentials.');
    console.error('Usage:');
    console.error('  node scripts/createAdmin.js "<name>" "<email>" "<password>"');
    console.error('Or set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in your .env file.');
    console.error('Example:');
    console.error('  node scripts/createAdmin.js "Botanical Admin" "admin@herbalgarden.edu" "Admin@Pass123"');
    console.error('====================================================');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters long.');
    process.exit(1);
  }

  try {
    const uri = getNormalizedMongoUri();
    await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB_NAME || 'herbal_garden',
      serverSelectionTimeoutMS: 10000
    });

    console.log('🌱 Connected to MongoDB Atlas.');

    let user = await User.findOne({ email });

    if (user) {
      console.log(`ℹ️ Existing user found with email: ${email}`);
      user.name = name;
      user.password = password; // Will be hashed by User pre-save hook
      user.role = 'admin';
      await user.save();
      console.log('====================================================');
      console.log(`✅ User promoted/updated to Administrator successfully!`);
      console.log(`👤 Name:  ${user.name}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🛡️ Role:  ${user.role}`);
      console.log('====================================================');
    } else {
      user = new User({
        name,
        email,
        password,
        role: 'admin'
      });
      await user.save();
      console.log('====================================================');
      console.log(`✅ New Administrator created successfully!`);
      console.log(`👤 Name:  ${user.name}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🛡️ Role:  ${user.role}`);
      console.log('====================================================');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create/update administrator:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

createAdmin();
