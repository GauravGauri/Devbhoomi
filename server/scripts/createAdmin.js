require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const createAdmin = async () => {
  try {
    await connectDB();
    
    let adminUser = await User.findOne({ username: 'Jpbhatt' });
    
    if (adminUser) {
      adminUser.email = 'Jpbhatt@gmail.com';
      adminUser.password = 'Jpbhatt@123';
      adminUser.role = 'admin';
      adminUser.status = 'Active';
      await adminUser.save();
      console.log('Admin user Jpbhatt password and role updated.');
    } else {
      adminUser = new User({
        employeeId: 'ADM001',
        name: 'JP Bhatt',
        username: 'Jpbhatt',
        email: 'Jpbhatt@gmail.com',
        password: 'Jpbhatt@123',
        role: 'admin',
        status: 'Active',
      });
      await adminUser.save();
      console.log('Admin user Jpbhatt created successfully.');
    }

    console.log('Username: Jpbhatt');
    console.log('Email:    Jpbhatt@gmail.com');
    console.log('Password: Jpbhatt@123');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

createAdmin();
