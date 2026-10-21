const mongoose = require('mongoose');

const plantSubmissionSchema = new mongoose.Schema(
  {
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitting user ID is required'],
      index: true
    },
    plantData: {
      name: {
        type: String,
        required: [true, 'Plant name is required'],
        trim: true,
        maxlength: [100, 'Plant name cannot exceed 100 characters']
      },
      scientificName: {
        type: String,
        required: [true, 'Botanical / scientific name is required'],
        trim: true,
        maxlength: [120, 'Botanical name cannot exceed 120 characters']
      },
      englishName: {
        type: String,
        trim: true,
        default: '',
        maxlength: [100, 'English name cannot exceed 100 characters']
      },
      family: {
        type: String,
        trim: true,
        default: '',
        maxlength: [100, 'Plant family cannot exceed 100 characters']
      },
      category: {
        type: String,
        enum: {
          values: ['Medicinal', 'Aromatic', 'Ayurvedic', 'Common Herbs', 'Other'],
          message: '{VALUE} is not a valid category'
        },
        default: 'Ayurvedic'
      },
      description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [3000, 'Description cannot exceed 3000 characters']
      },
      benefits: {
        type: String,
        trim: true,
        default: '',
        maxlength: [2000, 'Benefits cannot exceed 2000 characters']
      },
      partsUsed: {
        type: String,
        trim: true,
        default: '',
        maxlength: [500, 'Parts used cannot exceed 500 characters']
      },
      cultivation: {
        type: String,
        trim: true,
        default: '',
        maxlength: [2000, 'Cultivation notes cannot exceed 2000 characters']
      },
      image: {
        type: String,
        trim: true,
        default: ''
      },
      sourceUrl: {
        type: String,
        trim: true,
        default: '',
        maxlength: [500, 'Source URL cannot exceed 500 characters']
      }
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    adminFeedback: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Feedback cannot exceed 1000 characters']
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast lookup
plantSubmissionSchema.index({ submittedBy: 1, createdAt: -1 });
plantSubmissionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PlantSubmission', plantSubmissionSchema);
