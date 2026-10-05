require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const createAdmin = async () => {
  try {
    await connectDB();
    
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const adminUser = new User({
      employeeId: 'ADM001',
      name: 'System Admin',
      username: 'admin',
      email: 'admin@devbhoomi.local',
      password: 'SecureAdminPassword123!',
      role: 'admin',
      status: 'Active',
    });

    await adminUser.save();
    console.log('Admin user created successfully.');
    console.log('Username: admin');
    console.log('Password: SecureAdminPassword123!');
    console.log('Please change this password after your first login.');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

createAdmin();
