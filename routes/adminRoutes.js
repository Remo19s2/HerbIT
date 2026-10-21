const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Plant = require('../models/Plant');
const GardenEntry = require('../models/GardenEntry');
const PlantSubmission = require('../models/PlantSubmission');
const { isAdmin } = require('../middleware/auth');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// All routes in this file require administrative authorization
router.use(isAdmin);

/**
 * GET /api/admin/stats
 * Overview analytics across all collections
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalPlants,
      totalUsers,
      totalGardenEntries,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions
    ] = await Promise.all([
      Plant.countDocuments(),
      User.countDocuments(),
      GardenEntry.countDocuments(),
      PlantSubmission.countDocuments({ status: 'pending' }),
      PlantSubmission.countDocuments({ status: 'approved' }),
      PlantSubmission.countDocuments({ status: 'rejected' })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalPlants,
        totalUsers,
        totalGardenEntries,
        pendingSubmissions,
        approvedSubmissions,
        rejectedSubmissions
      }
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving stats' });
  }
});

/**
 * GET /api/admin/users
 * Paginated and searchable list of registered users
 */
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search ? req.query.search.trim() : '';

    const query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: users.length,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Detailed profile of a specific user with their garden & submission count
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [gardenCount, submissionCount] = await Promise.all([
      GardenEntry.countDocuments({ userId: user._id }),
      PlantSubmission.countDocuments({ submittedBy: user._id })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        gardenCount,
        submissionCount
      }
    });
  } catch (error) {
    console.error('Error fetching user detail:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving user' });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Activate or deactivate a user account (Safety checks prevent admin lock-out)
 */
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }

    // Safety: Prevent admin from deactivating their own currently logged-in account
    if (req.session.userId === id && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safety: If deactivating an admin, ensure there is at least one other active admin
    if (targetUser.role === 'admin' && !isActive) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the sole remaining active administrator.'
        });
      }
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `User account has been ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: targetUser.toJSON()
    });
  } catch (error) {
    console.error('Error updating user status:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating user status' });
  }
});

/**
 * GET /api/admin/submissions
 * Review community plant submissions
 */
router.get('/submissions', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== 'all' && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const submissions = await PlantSubmission.find(filter)
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Error retrieving submissions for admin:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving submissions' });
  }
});

/**
 * GET /api/admin/submissions/:id
 * Inspect a specific submission
 */
router.get('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid submission ID' });
    }

    const submission = await PlantSubmission.findById(id)
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    return res.status(200).json({ success: true, data: submission });
  } catch (error) {
    console.error('Error retrieving submission detail:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * PATCH /api/admin/submissions/:id/review
 * Approve or Reject a community submission
 * On approval: seamlessly creates or updates canonical Plant in collection without duplicate!
 */
router.patch('/submissions/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminFeedback } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid submission ID' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }

    const submission = await PlantSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const reviewerId = req.session.userId;
    submission.reviewedBy = reviewerId;
    submission.reviewedAt = new Date();
    submission.adminFeedback = adminFeedback ? adminFeedback.trim() : '';

    if (action === 'approve') {
      submission.status = 'approved';

      // Check if plant with the same scientific name or botanical name already exists in database
      const existingPlant = await Plant.findOne({
        $or: [
          { scientificName: new RegExp(`^${submission.plantData.scientificName.trim()}$`, 'i') },
          { name: new RegExp(`^${submission.plantData.name.trim()}$`, 'i') }
        ]
      });

      if (!existingPlant) {
        // Create new canonical Plant record
        const newPlant = new Plant({
          name: submission.plantData.name,
          scientificName: submission.plantData.scientificName,
          botanical_name: submission.plantData.scientificName,
          englishName: submission.plantData.englishName || '',
          family: submission.plantData.family || '',
          category: submission.plantData.category || 'Ayurvedic',
          description: submission.plantData.description,
          preview: submission.plantData.description,
          benefits: submission.plantData.benefits || '',
          partsUsed: submission.plantData.partsUsed || '',
          cultivation: submission.plantData.cultivation || '',
          image: submission.plantData.image || '',
          link: submission.plantData.sourceUrl || ''
        });
        await newPlant.save();
      } else {
        // Update existing record if needed without creating a duplicate
        if (!existingPlant.description && submission.plantData.description) {
          existingPlant.description = submission.plantData.description;
        }
        if (!existingPlant.benefits && submission.plantData.benefits) {
          existingPlant.benefits = submission.plantData.benefits;
        }
        await existingPlant.save();
      }
    } else {
      submission.status = 'rejected';
    }

    const saved = await submission.save();
    await saved.populate('submittedBy', 'name email');
    await saved.populate('reviewedBy', 'name email');

    return res.status(200).json({
      success: true,
      message: `Submission marked as ${submission.status}`,
      data: saved
    });
  } catch (error) {
    console.error('Error reviewing submission:', error.message);
    return res.status(500).json({ success: false, message: 'Server error reviewing submission' });
  }
});

module.exports = router;
