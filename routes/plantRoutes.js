const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Plant = require('../models/Plant');
const samplePlants = require('../data/samplePlants');
const { isAdmin } = require('../middleware/auth');

// Helper to check valid MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// In-Memory store for offline fallback / instant demo
let inMemoryPlants = samplePlants.map((p, idx) => ({
  _id: new mongoose.Types.ObjectId().toString(),
  ...p,
  createdAt: new Date(Date.now() - (samplePlants.length - idx) * 60000).toISOString(),
  updatedAt: new Date().toISOString()
}));

const isDbConnected = () => mongoose.connection.readyState === 1;

// -------------------------------------------------------------
// GET /api/plants
// Retrieve all plants (with optional search / category filtering)
// -------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;

    if (isDbConnected()) {
      const filter = {};
      if (category && category !== 'All') {
        filter.category = category;
      }
      if (search && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { name: searchRegex },
          { scientificName: searchRegex },
          { botanical_name: searchRegex },
          { englishName: searchRegex },
          { family: searchRegex },
          { sanskritSynonyms: searchRegex },
          { description: searchRegex }
        ];
      }

      const plants = await Plant.find(filter).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: plants.length,
        source: 'mongodb',
        data: plants
      });
    }

    // In-Memory Fallback
    let plants = [...inMemoryPlants];
    if (category && category !== 'All') {
      plants = plants.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      plants = plants.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.scientificName && p.scientificName.toLowerCase().includes(q)) ||
          (p.englishName && p.englishName.toLowerCase().includes(q)) ||
          (p.family && p.family.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: plants.length,
      source: 'in-memory-fallback',
      data: plants
    });
  } catch (error) {
    console.error('Error fetching plants:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching plants',
      error: error.message
    });
  }
});

// -------------------------------------------------------------
// GET /api/plants/:id
// Retrieve a single plant by its ID
// -------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Plant ID format'
        });
      }

      const plant = await Plant.findById(id);

      if (!plant) {
        return res.status(404).json({
          success: false,
          message: 'Plant not found'
        });
      }

      return res.status(200).json({
        success: true,
        source: 'mongodb',
        data: plant
      });
    }

    // In-memory fallback
    const plant = inMemoryPlants.find((p) => p._id.toString() === id.toString());
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found'
      });
    }

    return res.status(200).json({
      success: true,
      source: 'in-memory-fallback',
      data: plant
    });
  } catch (error) {
    console.error('Error fetching plant by ID:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching plant details',
      error: error.message
    });
  }
});

// -------------------------------------------------------------
// POST /api/plants
// Add a new medicinal plant
// -------------------------------------------------------------
router.post('/', isAdmin, async (req, res) => {
  try {
    const {
      name,
      scientificName,
      category,
      description,
      benefits,
      partsUsed,
      cultivation,
      image
    } = req.body;

    // Basic presence validation
    if (!name || !scientificName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least name and scientificName'
      });
    }

    if (isDbConnected()) {
      const newPlant = new Plant({
        name: name.trim(),
        scientificName: scientificName.trim(),
        botanical_name: req.body.botanical_name ? req.body.botanical_name.trim() : scientificName.trim(),
        englishName: req.body.englishName ? req.body.englishName.trim() : '',
        family: req.body.family ? req.body.family.trim() : '',
        category: category || 'Ayurvedic',
        description: description ? description.trim() : '',
        preview: req.body.preview ? req.body.preview.trim() : (description ? description.trim() : ''),
        benefits: benefits ? benefits.trim() : '',
        partsUsed: partsUsed ? partsUsed.trim() : '',
        cultivation: cultivation ? cultivation.trim() : '',
        image: image ? image.trim() : '',
        sanskritSynonyms: Array.isArray(req.body.sanskritSynonyms) ? req.body.sanskritSynonyms : [],
        mainIndications: Array.isArray(req.body.mainIndications) ? req.body.mainIndications : [],
        link: req.body.link ? req.body.link.trim() : '',
        pacify: Array.isArray(req.body.pacify) ? req.body.pacify : [],
        aggravate: Array.isArray(req.body.aggravate) ? req.body.aggravate : [],
        tridosha: Boolean(req.body.tridosha),
        rasa: Array.isArray(req.body.rasa) ? req.body.rasa : [],
        guna: Array.isArray(req.body.guna) ? req.body.guna : [],
        virya: req.body.virya ? req.body.virya.trim() : '',
        vipaka: req.body.vipaka ? req.body.vipaka.trim() : '',
        prabhav: Array.isArray(req.body.prabhav) ? req.body.prabhav : []
      });

      const savedPlant = await newPlant.save();

      return res.status(201).json({
        success: true,
        message: 'Plant added successfully to MongoDB',
        data: savedPlant
      });
    }

    // In-memory fallback
    const newRecord = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: name.trim(),
      scientificName: scientificName.trim(),
      botanical_name: req.body.botanical_name ? req.body.botanical_name.trim() : scientificName.trim(),
      englishName: req.body.englishName ? req.body.englishName.trim() : '',
      family: req.body.family ? req.body.family.trim() : '',
      category: category || 'Ayurvedic',
      description: description ? description.trim() : '',
      preview: req.body.preview ? req.body.preview.trim() : (description ? description.trim() : ''),
      benefits: benefits ? benefits.trim() : '',
      partsUsed: partsUsed ? partsUsed.trim() : '',
      cultivation: cultivation ? cultivation.trim() : '',
      image: image ? image.trim() : '',
      sanskritSynonyms: Array.isArray(req.body.sanskritSynonyms) ? req.body.sanskritSynonyms : [],
      mainIndications: Array.isArray(req.body.mainIndications) ? req.body.mainIndications : [],
      link: req.body.link ? req.body.link.trim() : '',
      pacify: Array.isArray(req.body.pacify) ? req.body.pacify : [],
      aggravate: Array.isArray(req.body.aggravate) ? req.body.aggravate : [],
      tridosha: Boolean(req.body.tridosha),
      rasa: Array.isArray(req.body.rasa) ? req.body.rasa : [],
      guna: Array.isArray(req.body.guna) ? req.body.guna : [],
      virya: req.body.virya ? req.body.virya.trim() : '',
      vipaka: req.body.vipaka ? req.body.vipaka.trim() : '',
      prabhav: Array.isArray(req.body.prabhav) ? req.body.prabhav : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryPlants.unshift(newRecord);

    return res.status(201).json({
      success: true,
      message: 'Plant added successfully (Active)',
      data: newRecord
    });
  } catch (error) {
    console.error('Error adding plant:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while adding plant',
      error: error.message
    });
  }
});

// -------------------------------------------------------------
// PUT /api/plants/:id
// Update an existing plant by its ID
// -------------------------------------------------------------
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Plant ID format'
        });
      }

      const updatedPlant = await Plant.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!updatedPlant) {
        return res.status(404).json({
          success: false,
          message: 'Plant not found to update'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Plant updated successfully',
        data: updatedPlant
      });
    }

    // In-memory fallback
    const index = inMemoryPlants.findIndex((p) => p._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found to update'
      });
    }

    inMemoryPlants[index] = {
      ...inMemoryPlants[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Plant updated successfully',
      data: inMemoryPlants[index]
    });
  } catch (error) {
    console.error('Error updating plant:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while updating plant',
      error: error.message
    });
  }
});

// -------------------------------------------------------------
// DELETE /api/plants/:id
// Delete a plant by its ID
// -------------------------------------------------------------
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Plant ID format'
        });
      }

      const deletedPlant = await Plant.findByIdAndDelete(id);

      if (!deletedPlant) {
        return res.status(404).json({
          success: false,
          message: 'Plant not found to delete'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Plant deleted successfully',
        data: deletedPlant
      });
    }

    // In-memory fallback
    const index = inMemoryPlants.findIndex((p) => p._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found to delete'
      });
    }

    const removed = inMemoryPlants.splice(index, 1)[0];

    return res.status(200).json({
      success: true,
      message: 'Plant deleted successfully',
      data: removed
    });
  } catch (error) {
    console.error('Error deleting plant:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting plant',
      error: error.message
    });
  }
});

// -------------------------------------------------------------
// POST /api/plants/seed
// Seed or reset sample botanical data
// -------------------------------------------------------------
router.post('/seed', isAdmin, async (req, res) => {
  try {
    const importHerbs = require('../scripts/importHerbs');

    if (isDbConnected()) {
      const stats = await importHerbs({ standalone: false });
      const currentPlants = await Plant.find().sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: 'Botanical database synchronized with Amidha Ayurveda dataset',
        stats: stats,
        count: currentPlants.length,
        data: currentPlants
      });
    }

    // In-memory reset
    inMemoryPlants = samplePlants.map((p, idx) => ({
      _id: new mongoose.Types.ObjectId().toString(),
      ...p,
      createdAt: new Date(Date.now() - (samplePlants.length - idx) * 60000).toISOString(),
      updatedAt: new Date().toISOString()
    }));

    return res.status(200).json({
      success: true,
      message: 'Sample plants reset successfully (In-Memory)',
      count: inMemoryPlants.length,
      data: inMemoryPlants
    });
  } catch (error) {
    console.error('Error seeding plants:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while seeding database',
      error: error.message
    });
  }
});

module.exports = router;
