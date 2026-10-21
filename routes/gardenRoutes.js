const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const GardenEntry = require('../models/GardenEntry');
const Plant = require('../models/Plant');
const { isAuthenticated } = require('../middleware/auth');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const VALID_STATUSES = ['Want to Grow', 'Growing', 'Mature', 'Learning', 'No Longer Growing'];

/**
 * GET /api/garden
 * Retrieve all garden entries for the authenticated user with optional status/favorite/search filter
 */
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { status, favorite, search } = req.query;

    const query = { userId };

    if (status && status !== 'All' && VALID_STATUSES.includes(status)) {
      query.status = status;
    }

    if (favorite === 'true') {
      query.isFavorite = true;
    }

    let entries = await GardenEntry.find(query)
      .populate('plantId')
      .sort({ updatedAt: -1, createdAt: -1 });

    // Filter out any entries where the referenced plant was removed
    entries = entries.filter((entry) => entry.plantId !== null);

    // In-memory search across plant names, scientific names, or personal notes if search query provided
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      entries = entries.filter((entry) => {
        const p = entry.plantId;
        const notesMatch = entry.personalNotes && entry.personalNotes.toLowerCase().includes(q);
        const nameMatch = p && p.name && p.name.toLowerCase().includes(q);
        const sciMatch = p && p.scientificName && p.scientificName.toLowerCase().includes(q);
        const catMatch = p && p.category && p.category.toLowerCase().includes(q);
        return notesMatch || nameMatch || sciMatch || catMatch;
      });
    }

    return res.status(200).json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    console.error('Error fetching garden entries:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving garden entries'
    });
  }
});

/**
 * POST /api/garden
 * Add a plant to the current user's personal garden (Duplicate prevented)
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { plantId, status, personalNotes, isFavorite } = req.body;

    if (!plantId || !isValidObjectId(plantId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid plant ID is required'
      });
    }

    // Verify target plant exists
    const plant = await Plant.findById(plantId);
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found in repository'
      });
    }

    // Check for duplicate in user's garden
    const existing = await GardenEntry.findOne({ userId, plantId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This medicinal plant is already in your personal garden'
      });
    }

    // Validate status if supplied
    const entryStatus = status && VALID_STATUSES.includes(status) ? status : 'Want to Grow';

    const newEntry = new GardenEntry({
      userId,
      plantId,
      status: entryStatus,
      personalNotes: personalNotes ? personalNotes.trim() : '',
      isFavorite: Boolean(isFavorite)
    });

    const savedEntry = await newEntry.save();
    await savedEntry.populate('plantId');

    return res.status(201).json({
      success: true,
      message: `"${plant.name}" added to your garden!`,
      data: savedEntry
    });
  } catch (error) {
    console.error('Error adding garden entry:', error.message);

    // Duplicate key error from mongo unique index
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This plant is already in your garden'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error saving to garden'
    });
  }
});

/**
 * GET /api/garden/:id
 * Retrieve a single garden entry by ID (Ownership enforced)
 */
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid garden entry ID'
      });
    }

    const entry = await GardenEntry.findById(id).populate('plantId');
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Garden entry not found'
      });
    }

    // Check ownership
    if (entry.userId.toString() !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this garden entry.'
      });
    }

    return res.status(200).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error fetching garden entry:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving garden entry'
    });
  }
});

/**
 * PUT /api/garden/:id
 * Update status, notes, or favorite toggle on a garden entry (Ownership enforced)
 */
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid garden entry ID'
      });
    }

    const entry = await GardenEntry.findById(id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Garden entry not found'
      });
    }

    // Check ownership
    if (entry.userId.toString() !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot modify another user\'s garden.'
      });
    }

    // Update allowable fields
    if (req.body.status !== undefined) {
      if (!VALID_STATUSES.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
        });
      }
      entry.status = req.body.status;
    }

    if (req.body.personalNotes !== undefined) {
      entry.personalNotes = String(req.body.personalNotes).trim();
    }

    if (req.body.isFavorite !== undefined) {
      entry.isFavorite = Boolean(req.body.isFavorite);
    }

    const updatedEntry = await entry.save();
    await updatedEntry.populate('plantId');

    return res.status(200).json({
      success: true,
      message: 'Garden entry updated successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error updating garden entry:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error updating garden entry'
    });
  }
});

/**
 * DELETE /api/garden/:id
 * Remove an entry from user's garden (Does NOT delete canonical Plant from database)
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid garden entry ID'
      });
    }

    const entry = await GardenEntry.findById(id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Garden entry not found'
      });
    }

    // Check ownership
    if (entry.userId.toString() !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot delete another user\'s garden entry.'
      });
    }

    await GardenEntry.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Plant removed from your personal garden'
    });
  } catch (error) {
    console.error('Error removing garden entry:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting garden entry'
    });
  }
});

module.exports = router;
