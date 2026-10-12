const Holiday = require('../models/Holiday');

// @desc    Get all holidays
// @route   GET /api/admin/holidays
// @access  Private (Admin & Employee can view)
const getHolidays = async (req, res, next) => {
  try {
    const holidays = await Holiday.find().sort('date');
    res.status(200).json({ success: true, data: holidays });
  } catch (error) {
    next(error);
  }
};

// @desc    Create holiday
// @route   POST /api/admin/holidays
// @access  Private/Admin
const createHoliday = async (req, res, next) => {
  try {
    const { name, date, description, type } = req.body;
    if (!name || !date) {
      res.status(400);
      throw new Error('Holiday name and date are required');
    }

    const existing = await Holiday.findOne({ date });
    if (existing) {
      res.status(400);
      throw new Error(`A holiday is already scheduled on ${date} (${existing.name})`);
    }

    const holiday = await Holiday.create({
      name,
      date,
      description: description || '',
      type: type || 'Company',
    });

    res.status(201).json({ success: true, message: 'Holiday added successfully', data: holiday });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete holiday
// @route   DELETE /api/admin/holidays/:id
// @access  Private/Admin
const deleteHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      res.status(404);
      throw new Error('Holiday not found');
    }

    await Holiday.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHolidays,
  createHoliday,
  deleteHoliday,
};
