const mongoose = require('mongoose');

const gardenEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plant',
      required: [true, 'Plant ID is required'],
      index: true
    },
    status: {
      type: String,
      required: [true, 'Garden status is required'],
      enum: {
        values: ['Want to Grow', 'Growing', 'Mature', 'Learning', 'No Longer Growing'],
        message: '{VALUE} is not a valid garden status'
      },
      default: 'Want to Grow'
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    personalNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Personal notes cannot exceed 2000 characters']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: A user can save a plant only once in their personal garden
gardenEntrySchema.index({ userId: 1, plantId: 1 }, { unique: true });

module.exports = mongoose.model('GardenEntry', gardenEntrySchema);
