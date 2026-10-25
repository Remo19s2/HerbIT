const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Plant = require('../models/Plant');
const samplePlants = require('../data/samplePlants');

dotenv.config();

let MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/herbal_garden';
if (MONGO_URI.includes('ssl=true')) {
  MONGO_URI = MONGO_URI.replace('ssl=true', 'tls=true');
}

const BOTANICAL_LOCAL_IMAGE_MAP = {
  'ocimum sanctum': 'images/plants/tulsi.jpg',
  'ocimum tenuiflorum': 'images/plants/tulsi.jpg',
  'azadirachta indica': 'images/plants/neem.jpg',
  'aloe barbadensis': 'images/plants/aloe-vera.jpg',
  'aloe barbadensis miller': 'images/plants/aloe-vera.jpg',
  'aloe vera': 'images/plants/aloe-vera.jpg',
  'curcuma longa': 'images/plants/turmeric.jpg',
  'zingiber officinale': 'images/plants/ginger.jpg',
  'mentha piperita': 'images/plants/mint.jpg',
  'mentha x piperita': 'images/plants/mint.jpg',
  'mentha arvensis': 'images/plants/mint.jpg',
  'withania somnifera': 'images/plants/ashwagandha.jpg',
  'cymbopogon citratus': 'images/plants/lemongrass.jpg',
  'emblica officinalis': 'images/plants/amla.jpg',
  'phyllanthus emblica': 'images/plants/amla.jpg',
  'bacopa monnieri': 'images/plants/brahmi.jpg'
};

async function updateImages() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || 'herbal_garden',
      serverSelectionTimeoutMS: 10000
    });
    console.log('Connected to MongoDB.');

    // 1. Update from samplePlants
    for (const sp of samplePlants) {
      const res = await Plant.updateMany(
        {
          $or: [
            { name: new RegExp(sp.name.split(' ')[0], 'i') },
            { scientificName: new RegExp(sp.scientificName, 'i') },
            { botanical_name: new RegExp(sp.scientificName, 'i') }
          ]
        },
        { $set: { image: sp.image } }
      );
      console.log(`Updated ${sp.name}: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
    }

    // 2. Update all records matching botanical names
    for (const [botName, imgPath] of Object.entries(BOTANICAL_LOCAL_IMAGE_MAP)) {
      const res = await Plant.updateMany(
        {
          $or: [
            { botanical_name: new RegExp(`^${botName}$`, 'i') },
            { scientificName: new RegExp(`^${botName}$`, 'i') }
          ]
        },
        { $set: { image: imgPath } }
      );
      if (res.modifiedCount > 0) {
        console.log(`Updated botanical ${botName} -> ${imgPath} (${res.modifiedCount} updated)`);
      }
    }

    console.log('Finished updating herb images in MongoDB.');
  } catch (err) {
    console.error('Error updating images:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

updateImages();
