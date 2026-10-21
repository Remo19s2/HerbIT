const express = require('express');
const router = express.Router();
const User = require('../models/User');
const GardenEntry = require('../models/GardenEntry');
const PlantSubmission = require('../models/PlantSubmission');
const { isAuthenticated } = require('../middleware/auth');

/**
 * GET /api/users/me
 * Retrieve the current authenticated user's profile and personal garden statistics
 */
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // Compute live garden metrics for the user
    const [totalSaved, growing, mature, wantToGrow, learning, favorites, submissionsCount] = await Promise.all([
      GardenEntry.countDocuments({ userId: user._id }),
      GardenEntry.countDocuments({ userId: user._id, status: 'Growing' }),
      GardenEntry.countDocuments({ userId: user._id, status: 'Mature' }),
      GardenEntry.countDocuments({ userId: user._id, status: 'Want to Grow' }),
      GardenEntry.countDocuments({ userId: user._id, status: 'Learning' }),
      GardenEntry.countDocuments({ userId: user._id, isFavorite: true }),
      PlantSubmission.countDocuments({ submittedBy: user._id })
    ]);

    return res.status(200).json({
      success: true,
      user: user.toJSON(),
      stats: {
        totalSaved,
        growing,
        mature,
        wantToGrow,
        learning,
        favorites,
        submissionsCount
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile'
    });
  }
});

/**
 * PUT /api/users/me
 * Update full name for the current authenticated user (Email & Role cannot be changed)
 */
router.put('/me', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid full name'
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 50 characters'
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    user.name = trimmedName;
    const updatedUser = await user.save();

    // Update session cache
    req.session.name = updatedUser.name;

    return res.status(200).json({
      success: true,
      message: 'Profile name updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Error updating user profile:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

/**
 * PUT /api/users/me/password
 * Change password requiring valid current password
 */
router.put('/me/password', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password, new password, and confirmation'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password'
      });
    }

    // Assign new password (triggers User pre-save bcrypt hook)
    user.password = newPassword;
    await user.save();

    // Regenerate session to protect against session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error after password change:', err);
      }
      req.session.userId = user._id.toString();
      req.session.role = user.role;
      req.session.name = user.name;
      req.session.email = user.email;

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    });
  } catch (error) {
    console.error('Error changing password:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
});

module.exports = router;
