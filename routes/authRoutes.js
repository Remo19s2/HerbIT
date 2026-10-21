const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authLimiter } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register a new user account (role is strictly 'user')
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate presence
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, password, confirmPassword'
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Name length validation
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 50 characters'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Password confirmation match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // Create user (Strictly default to 'user' role regardless of request body)
    const newUser = new User({
      name: trimmedName,
      email: normalizedEmail,
      password: password,
      role: 'user'
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully! You can now log in.',
      user: savedUser.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again later.'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user credentials and create secure session
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up user
    const user = await User.findOne({ email: normalizedEmail });

    // Generic error message if user not found or password incorrect (prevents email enumeration)
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    // Protect against Session Fixation: Regenerate session ID upon authentication
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error creating secure session'
        });
      }

      // Store only non-sensitive identifying data in session
      req.session.userId = user._id.toString();
      req.session.role = user.role;
      req.session.name = user.name;
      req.session.email = user.email;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: user.toJSON()
      });
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again later.'
    });
  }
});

/**
 * POST /api/auth/logout
 * Destroy session and clear session cookie
 */
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout session destruction error:', err);
        return res.status(500).json({
          success: false,
          message: 'Could not log out. Please try again.'
        });
      }

      res.clearCookie('connect.sid', { path: '/' });
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  } else {
    return res.status(200).json({
      success: true,
      message: 'No active session'
    });
  }
});

/**
 * GET /api/auth/me
 * Return current session user state
 */
router.get('/me', (req, res) => {
  if (req.session && req.session.userId) {
    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: req.session.userId,
        name: req.session.name,
        email: req.session.email,
        role: req.session.role
      }
    });
  }

  return res.status(200).json({
    success: true,
    authenticated: false,
    user: null
  });
});

module.exports = router;
