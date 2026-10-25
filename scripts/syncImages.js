require('dotenv').config();
const mongoose = require('mongoose');
const Plant = require('../models/Plant');
const samplePlants = require('../data/samplePlants');

async function syncDb() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });
  console.log('Connected to MongoDB');

  // 1. Clear faulty amla images on unrelated plants
  const clearResult = await Plant.updateMany(
    { 
      scientificName: { $in: ['Garcinia indica', 'Garcinia pedunculata', 'Rheum emodi'] }
    },
    { $set: { image: '' } }
  );
  console.log('Cleared fake amla from non-emblica plants:', clearResult.modifiedCount);

  // 2. Strict mappings by exact scientific name
  const botMap = {
    'ocimum tenuiflorum': 'images/plants/tulsi.jpg',
    'ocimum sanctum': 'images/plants/tulsi.jpg',
    'azadirachta indica': 'images/plants/neem.jpg',
    'aloe barbadensis miller': 'images/plants/aloe-vera.jpg',
    'aloe barbadensis': 'images/plants/aloe-vera.jpg',
    'aloe vera': 'images/plants/aloe-vera.jpg',
    'curcuma longa': 'images/plants/turmeric.jpg',
    'zingiber officinale': 'images/plants/ginger.jpg',
    'mentha x piperita': 'images/plants/mint.jpg',
    'mentha piperita': 'images/plants/mint.jpg',
    'mentha arvensis': 'images/plants/mint.jpg',
    'withania somnifera': 'images/plants/ashwagandha.jpg',
    'cymbopogon citratus': 'images/plants/lemongrass.jpg',
    'bacopa monnieri': 'images/plants/brahmi.jpg',
    'phyllanthus emblica': 'images/plants/amla.jpg',
    'emblica officinalis': 'images/plants/amla.jpg',
    'murraya koenigii': 'images/plants/curry-leaf.jpg',
    'coriandrum sativum': 'images/plants/coriander.jpg',
    'trigonella foenum-graecum': 'images/plants/fenugreek.jpg',
    'hibiscus rosa-sinensis': 'images/plants/hibiscus.jpg',
    'allium sativum': 'images/plants/garlic.jpg',
    'centella asiatica': 'images/plants/gotu-kola.jpg',
    'eucalyptus globulus': 'images/plants/eucalyptus.jpg',
    'tinospora cordifolia': 'images/plants/giloy.jpg'
  };

  for (const [sci, img] of Object.entries(botMap)) {
    const res = await Plant.updateMany(
      { scientificName: new RegExp('^' + sci + '$', 'i') },
      { $set: { image: img } }
    );
    if (res.matchedCount > 0) {
      console.log('Mapped', sci, '->', img, '(' + res.modifiedCount + ' updated)');
    }
  }

  // 3. Ensure Curry Leaf and Eucalyptus exist in the database
  for (const item of samplePlants) {
    const exists = await Plant.findOne({ 
      $or: [
        { name: item.name },
        { scientificName: new RegExp('^' + item.scientificName + '$', 'i') }
      ]
    });
    if (!exists) {
      await Plant.create(item);
      console.log('Inserted missing common plant:', item.name);
    }
  }

  console.log('Sync complete.');
  process.exit(0);
}

syncDb().catch(err => {
  console.error(err);
  process.exit(1);
});
