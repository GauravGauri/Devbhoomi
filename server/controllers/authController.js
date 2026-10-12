const User = require('../models/User');
const { generateToken, clearToken } = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      if (user.status !== 'Active') {
        res.status(403);
        throw new Error('Your account is not active. Please contact administrator.');
      }
      if (user.role !== 'employee') {
        res.status(403);
        throw new Error('Not authorized as employee.');
      }

      generateToken(res, user._id);

      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          employeeId: user.employeeId,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        }
      });
    } else {
      res.status(401);
      throw new Error('Invalid username or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth admin & get token
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body; // Can be username or email

    // Check by username or email
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    });

    if (user && (await user.matchPassword(password))) {
      if (user.status !== 'Active') {
        res.status(403);
        throw new Error('Your account is not active.');
      }
      if (user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized as admin.');
      }

      generateToken(res, user._id);

      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          employeeId: user.employeeId,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        }
      });
    } else {
      res.status(401);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res, next) => {
  try {
    clearToken(res);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.status(200).json({ success: true, data: user });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        employeeId: updatedUser.employeeId,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        department: updatedUser.department,
        designation: updatedUser.designation,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Please provide current password and new password');
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      throw new Error('Incorrect current password');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
  loginAdmin,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
};
