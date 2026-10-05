const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  startTime: {
    type: String, // HH:mm
    required: true,
  },
  endTime: {
    type: String, // HH:mm
    required: true,
  },
  gracePeriod: {
    type: Number, // in minutes
    default: 15,
  },
  minimumWorkingHours: {
    type: Number, // in minutes (e.g. 8 hours = 480)
    default: 480,
  },
  halfDayWorkingHours: {
    type: Number, // in minutes
    default: 240,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  }
}, {
  timestamps: true,
});

const Shift = mongoose.model('Shift', shiftSchema);
module.exports = Shift;
