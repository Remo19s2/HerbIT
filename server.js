const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const MongoStore = connectMongo.MongoStore || connectMongo.default || connectMongo;

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
let MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/herbal_garden';
if (MONGO_URI.includes('ssl=true')) {
  MONGO_URI = MONGO_URI.replace('ssl=true', 'tls=true');
}

// Trust reverse proxy if running in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Store and Configuration
const sessionStore = MongoStore.create({
  mongoUrl: MONGO_URI,
  dbName: process.env.MONGO_DB_NAME || 'herbal_garden',
  collectionName: 'sessions',
  ttl: 14 * 24 * 60 * 60, // 14 days
  autoRemove: 'native'
});

sessionStore.on('error', function (error) {
  console.warn('⚠️ Session store notice:', error.message);
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'vhg_secret_key_phase2_fallback',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    }
  })
);

// Import Authorization Middleware
const { isAuthenticated, isAdmin } = require('./middleware/auth');

// Protect authenticated HTML pages before static file serving
app.get('/admin.html', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/profile.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/garden.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'garden.html'));
});

app.get('/submit-plant.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'submit-plant.html'));
});

// Serve static frontend files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Import Routes and Models
const plantRoutes = require('./routes/plantRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const gardenRoutes = require('./routes/gardenRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const Plant = require('./models/Plant');
const importHerbs = require('./scripts/importHerbs');

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/garden', gardenRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/plants', plantRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'HerbIT API is active',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Database Auto-Seeder helper function (Populates initial data if DB is empty)
async function autoSeedDatabase() {
  try {
    const count = await Plant.countDocuments();
    if (count === 0) {
      console.log('🌿 Database is empty. Seeding initial medicinal plant dataset...');
      await importHerbs({ standalone: false });
    } else {
      console.log(`🌿 Database has ${count} existing plant records.`);
    }
  } catch (seedErr) {
    console.warn('⚠️ Auto-seed notice:', seedErr.message);
  }
}

// Connect to MongoDB Atlas / Local Database
mongoose
  .connect(MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || 'herbal_garden',
    serverSelectionTimeoutMS: 10000
  })
  .then(async () => {
    console.log('====================================================');
    console.log('🌱 MongoDB Connected Successfully!');
    console.log(`📦 Database Host: ${mongoose.connection.host}`);
    console.log(`📂 Database Name: ${mongoose.connection.name}`);
    console.log('====================================================');
    await autoSeedDatabase();
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('👉 Please check your MONGO_URI in the .env file.');
  });

// Fallback for API 404s
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🌿 HerbIT Server running on: http://localhost:${PORT}`);
  console.log(`🚀 Home Page:  http://localhost:${PORT}`);
  console.log(`⚙️  Admin Page: http://localhost:${PORT}/admin.html`);
  console.log(`📡 API Base:   http://localhost:${PORT}/api/plants`);
  console.log('====================================================');
});
