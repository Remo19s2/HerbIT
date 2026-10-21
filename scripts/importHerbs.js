const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Plant = require('../models/Plant');
const samplePlants = require('../data/samplePlants');

// Normalize MONGO_URI to ensure modern TLS 1.3 compatibility with Node 20+
function getNormalizedMongoUri() {
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/herbal_garden';
  if (uri.includes('ssl=true')) {
    uri = uri.replace('ssl=true', 'tls=true');
  }
  return uri;
}

function escapeRegex(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

async function importHerbs(options = { standalone: false }) {
  const stats = {
    totalInDataset: 0,
    validRecords: 0,
    invalidRecords: 0,
    sampleInserted: 0,
    insertedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    totalInDatabase: 0
  };

  try {
    const datasetPath = path.join(__dirname, '..', 'herb-database-main', 'herb.json');
    if (!fs.existsSync(datasetPath)) {
      throw new Error(`Dataset not found at: ${datasetPath}`);
    }

    const rawData = fs.readFileSync(datasetPath, 'utf8');
    const herbs = JSON.parse(rawData);

    if (!Array.isArray(herbs)) {
      throw new Error('Dataset root is not a JSON array');
    }

    stats.totalInDataset = herbs.length;

    // Connect to database if not already connected
    if (mongoose.connection.readyState !== 1) {
      const uri = getNormalizedMongoUri();
      await mongoose.connect(uri, {
        dbName: process.env.MONGO_DB_NAME || 'herbal_garden',
        serverSelectionTimeoutMS: 10000
      });
    }

    console.log('====================================================');
    console.log('🌿 Starting Amidha Ayurveda Herb Dataset Import');
    console.log(`📦 Connected Database: ${mongoose.connection.name}`);
    console.log(`📄 Total records in herb.json: ${stats.totalInDataset}`);
    console.log('====================================================');

    // 1. If database is completely empty, insert initial 10 curated sample plants first
    const initialCount = await Plant.countDocuments();
    if (initialCount === 0 && Array.isArray(samplePlants) && samplePlants.length > 0) {
      console.log('🌱 Database is empty. Seeding foundational sample plants with photos...');
      for (const sp of samplePlants) {
        await Plant.create(sp);
        stats.sampleInserted++;
      }
      console.log(`✅ Seeded ${stats.sampleInserted} foundational sample plants.`);
    }

    // 2. Process each herb record safely
    for (const herb of herbs) {
      if (!herb.name || !herb.name.trim() || !herb.botanical_name || !herb.botanical_name.trim()) {
        stats.invalidRecords++;
        continue;
      }

      stats.validRecords++;

      const cleanName = herb.name.trim();
      const cleanBotName = herb.botanical_name.trim();

      // Look up existing plant by canonical name or name with subtitle (e.g. "Tulsi" matches "Tulsi (Holy Basil)")
      const existing = await Plant.findOne({
        $or: [
          { name: new RegExp(`^${escapeRegex(cleanName)}$`, 'i') },
          { name: new RegExp(`^${escapeRegex(cleanName)}\\s*\\(`, 'i') }
        ]
      });

      if (existing) {
        // Safe update: preserve existing images, descriptions, and cultivation
        let changed = false;

        if (!existing.englishName && herb.english_name) {
          existing.englishName = herb.english_name.trim();
          changed = true;
        }
        if (!existing.family && herb.family) {
          existing.family = herb.family.trim();
          changed = true;
        }
        if (!existing.botanical_name && herb.botanical_name) {
          existing.botanical_name = cleanBotName;
          changed = true;
        }
        if ((!existing.sanskritSynonyms || existing.sanskritSynonyms.length === 0) && Array.isArray(herb.sanskrit_synonyms) && herb.sanskrit_synonyms.length > 0) {
          existing.sanskritSynonyms = herb.sanskrit_synonyms;
          changed = true;
        }
        if ((!existing.part_used || existing.part_used.length === 0) && Array.isArray(herb.part_used) && herb.part_used.length > 0) {
          existing.part_used = herb.part_used;
          changed = true;
        }
        if ((!existing.mainIndications || existing.mainIndications.length === 0) && Array.isArray(herb.main_indications) && herb.main_indications.length > 0) {
          existing.mainIndications = herb.main_indications;
          changed = true;
        }
        if (!existing.link && herb.link) {
          existing.link = herb.link.trim();
          changed = true;
        }
        if (!existing.preview && herb.preview) {
          existing.preview = herb.preview.trim();
          changed = true;
        }
        if ((!existing.pacify || existing.pacify.length === 0) && Array.isArray(herb.pacify)) {
          existing.pacify = herb.pacify;
          changed = true;
        }
        if ((!existing.aggravate || existing.aggravate.length === 0) && Array.isArray(herb.aggravate)) {
          existing.aggravate = herb.aggravate;
          changed = true;
        }
        if (existing.tridosha === false && herb.tridosha === true) {
          existing.tridosha = true;
          changed = true;
        }
        if ((!existing.rasa || existing.rasa.length === 0) && Array.isArray(herb.rasa)) {
          existing.rasa = herb.rasa;
          changed = true;
        }
        if ((!existing.guna || existing.guna.length === 0) && Array.isArray(herb.guna)) {
          existing.guna = herb.guna;
          changed = true;
        }
        if (!existing.virya && herb.virya) {
          existing.virya = herb.virya.trim();
          changed = true;
        }
        if (!existing.vipaka && herb.vipaka) {
          existing.vipaka = herb.vipaka.trim();
          changed = true;
        }
        if ((!existing.prabhav || existing.prabhav.length === 0) && Array.isArray(herb.prabhav)) {
          existing.prabhav = herb.prabhav;
          changed = true;
        }

        // Keep existing rich descriptions/benefits intact, fill if empty
        if (!existing.description && herb.preview) {
          existing.description = herb.preview.trim();
          changed = true;
        }
        if (!existing.partsUsed && Array.isArray(herb.part_used) && herb.part_used.length > 0) {
          existing.partsUsed = herb.part_used.join(', ');
          changed = true;
        }
        if (!existing.benefits && Array.isArray(herb.main_indications) && herb.main_indications.length > 0) {
          existing.benefits = `Traditional Indications: ${herb.main_indications.join(', ')}`;
          changed = true;
        }

        if (changed) {
          await existing.save();
          stats.updatedCount++;
        } else {
          stats.skippedCount++;
        }
      } else {
        // Create new record
        const newRecord = new Plant({
          name: cleanName,
          scientificName: cleanBotName,
          botanical_name: cleanBotName,
          englishName: (herb.english_name || '').trim(),
          family: (herb.family || '').trim(),
          category: 'Ayurvedic',
          description: (herb.preview || '').trim(),
          preview: (herb.preview || '').trim(),
          benefits: Array.isArray(herb.main_indications) && herb.main_indications.length > 0
            ? `Traditional Indications: ${herb.main_indications.join(', ')}`
            : '',
          partsUsed: Array.isArray(herb.part_used) ? herb.part_used.join(', ') : '',
          part_used: Array.isArray(herb.part_used) ? herb.part_used : [],
          cultivation: '',
          image: '',
          sanskritSynonyms: Array.isArray(herb.sanskrit_synonyms) ? herb.sanskrit_synonyms : [],
          mainIndications: Array.isArray(herb.main_indications) ? herb.main_indications : [],
          link: (herb.link || '').trim(),
          pacify: Array.isArray(herb.pacify) ? herb.pacify : [],
          aggravate: Array.isArray(herb.aggravate) ? herb.aggravate : [],
          tridosha: Boolean(herb.tridosha),
          rasa: Array.isArray(herb.rasa) ? herb.rasa : [],
          guna: Array.isArray(herb.guna) ? herb.guna : [],
          virya: (herb.virya || '').trim(),
          vipaka: (herb.vipaka || '').trim(),
          prabhav: Array.isArray(herb.prabhav) ? herb.prabhav : []
        });

        await newRecord.save();
        stats.insertedCount++;
      }
    }

    stats.totalInDatabase = await Plant.countDocuments();

    console.log('====================================================');
    console.log('✅ Import Completed Successfully:');
    console.log(`   - Dataset Total:        ${stats.totalInDataset}`);
    console.log(`   - Valid Records:        ${stats.validRecords}`);
    console.log(`   - Invalid Records:      ${stats.invalidRecords}`);
    console.log(`   - New Plants Inserted:  ${stats.insertedCount}`);
    console.log(`   - Plants Updated:       ${stats.updatedCount}`);
    console.log(`   - Skipped / Unchanged:  ${stats.skippedCount}`);
    console.log(`   - Foundational Seeds:   ${stats.sampleInserted}`);
    console.log(`   - Total in MongoDB:     ${stats.totalInDatabase}`);
    console.log('====================================================');

    if (options.standalone) {
      await mongoose.disconnect();
      process.exit(0);
    }

    return stats;
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    if (options.standalone) {
      await mongoose.disconnect();
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  importHerbs({ standalone: true });
}

module.exports = importHerbs;
