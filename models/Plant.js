const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plant name is required'],
      trim: true
    },
    scientificName: {
      type: String,
      required: [true, 'Scientific / botanical name is required'],
      trim: true
    },
    botanical_name: {
      type: String,
      trim: true,
      default: ''
    },
    englishName: {
      type: String,
      trim: true,
      default: ''
    },
    family: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Medicinal', 'Aromatic', 'Ayurvedic', 'Common Herbs', 'Other'],
        message: '{VALUE} is not a valid category'
      },
      default: 'Ayurvedic'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    preview: {
      type: String,
      trim: true,
      default: ''
    },
    benefits: {
      type: String,
      trim: true,
      default: ''
    },
    partsUsed: {
      type: String,
      trim: true,
      default: ''
    },
    part_used: {
      type: [String],
      default: []
    },
    cultivation: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    sanskritSynonyms: {
      type: [String],
      default: []
    },
    mainIndications: {
      type: [String],
      default: []
    },
    link: {
      type: String,
      trim: true,
      default: ''
    },
    pacify: {
      type: [String],
      default: []
    },
    aggravate: {
      type: [String],
      default: []
    },
    tridosha: {
      type: Boolean,
      default: false
    },
    rasa: {
      type: [String],
      default: []
    },
    guna: {
      type: [String],
      default: []
    },
    virya: {
      type: String,
      trim: true,
      default: ''
    },
    vipaka: {
      type: String,
      trim: true,
      default: ''
    },
    prabhav: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Keep scientificName and botanical_name in sync, as well as description and preview
plantSchema.pre('validate', function(next) {
  if (!this.scientificName && this.botanical_name) {
    this.scientificName = this.botanical_name;
  }
  if (!this.botanical_name && this.scientificName) {
    this.botanical_name = this.scientificName;
  }
  if (!this.description && this.preview) {
    this.description = this.preview;
  }
  if (!this.preview && this.description) {
    this.preview = this.description;
  }
  next();
});

// Indexes for fast searching
plantSchema.index({ name: 1 });
plantSchema.index({ scientificName: 1 });
plantSchema.index({ englishName: 1 });
plantSchema.index({ category: 1 });

module.exports = mongoose.model('Plant', plantSchema);

