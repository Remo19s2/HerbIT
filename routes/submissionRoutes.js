const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PlantSubmission = require('../models/PlantSubmission');
const { isAuthenticated } = require('../middleware/auth');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * POST /api/submissions
 * Authenticated users can submit a medicinal plant for review
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const {
      name,
      scientificName,
      englishName,
      family,
      category,
      description,
      benefits,
      partsUsed,
      cultivation,
      image,
      sourceUrl
    } = req.body;

    if (!name || !scientificName || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name, botanical/scientific name, and description are required'
      });
    }

    const trimmedName = name.trim();
    const trimmedScientific = scientificName.trim();
    const trimmedDesc = description.trim();

    if (trimmedName.length < 2 || trimmedScientific.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name and scientific name must be at least 2 characters long'
      });
    }

    const newSubmission = new PlantSubmission({
      submittedBy: userId,
      plantData: {
        name: trimmedName,
        scientificName: trimmedScientific,
        englishName: englishName ? englishName.trim() : '',
        family: family ? family.trim() : '',
        category: category || 'Ayurvedic',
        description: trimmedDesc,
        benefits: benefits ? benefits.trim() : '',
        partsUsed: partsUsed ? partsUsed.trim() : '',
        cultivation: cultivation ? cultivation.trim() : '',
        image: image ? image.trim() : '',
        sourceUrl: sourceUrl ? sourceUrl.trim() : ''
      },
      status: 'pending'
    });

    const saved = await newSubmission.save();

    return res.status(201).json({
      success: true,
      message: 'Medicinal plant suggestion submitted successfully! An administrator will review it.',
      data: saved
    });
  } catch (error) {
    console.error('Submission error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error saving plant submission'
    });
  }
});

/**
 * GET /api/submissions/mine
 * Retrieve all submissions created by the authenticated user
 */
router.get('/mine', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const submissions = await PlantSubmission.find({ submittedBy: userId })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving your submissions'
    });
  }
});

/**
 * GET /api/submissions/:id
 * Retrieve a single submission (Owner or Admin only)
 */
router.get('/:id', isAuthenticated, async (req, res) => {
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

    const isOwner = submission.submittedBy._id.toString() === req.session.userId;
    const isAdmin = req.session.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this submission'
      });
    }

    return res.status(200).json({ success: true, data: submission });
  } catch (error) {
    console.error('Error retrieving submission:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * PUT /api/submissions/:id
 * Submitter can edit their pending submission
 */
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid submission ID' });
    }

    const submission = await PlantSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (submission.submittedBy.toString() !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own submissions.'
      });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a submission that has already been reviewed.'
      });
    }

    const {
      name,
      scientificName,
      englishName,
      family,
      category,
      description,
      benefits,
      partsUsed,
      cultivation,
      image,
      sourceUrl
    } = req.body;

    if (name) submission.plantData.name = name.trim();
    if (scientificName) submission.plantData.scientificName = scientificName.trim();
    if (englishName !== undefined) submission.plantData.englishName = englishName.trim();
    if (family !== undefined) submission.plantData.family = family.trim();
    if (category) submission.plantData.category = category;
    if (description) submission.plantData.description = description.trim();
    if (benefits !== undefined) submission.plantData.benefits = benefits.trim();
    if (partsUsed !== undefined) submission.plantData.partsUsed = partsUsed.trim();
    if (cultivation !== undefined) submission.plantData.cultivation = cultivation.trim();
    if (image !== undefined) submission.plantData.image = image.trim();
    if (sourceUrl !== undefined) submission.plantData.sourceUrl = sourceUrl.trim();

    const updated = await submission.save();

    return res.status(200).json({
      success: true,
      message: 'Plant submission updated',
      data: updated
    });
  } catch (error) {
    console.error('Error updating submission:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating submission' });
  }
});

/**
 * DELETE /api/submissions/:id
 * Submitter can withdraw pending submission (or Admin can delete)
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid submission ID' });
    }

    const submission = await PlantSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const isOwner = submission.submittedBy.toString() === req.session.userId;
    const isAdmin = req.session.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (isOwner && !isAdmin && submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw an already reviewed submission'
      });
    }

    await PlantSubmission.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Submission withdrawn / removed successfully'
    });
  } catch (error) {
    console.error('Error deleting submission:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
