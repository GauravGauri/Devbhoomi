const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    enum: ['National', 'Company', 'Optional'],
    default: 'Company',
  }
}, {
  timestamps: true,
});

const Holiday = mongoose.model('Holiday', holidaySchema);
module.exports = Holiday;
