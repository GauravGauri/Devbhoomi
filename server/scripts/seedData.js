require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment');
const connectDB = require('../config/db');

const User = require('../models/User');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const AttendanceSettings = require('../models/AttendanceSettings');
const Holiday = require('../models/Holiday');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB for seeding...');

    // 1. Settings
    let settings = await AttendanceSettings.findOne();
    if (!settings) {
      settings = await AttendanceSettings.create({
        officeStartTime: '09:30',
        officeEndTime: '18:30',
        gracePeriod: 15,
        minimumWorkingHours: 480,
        halfDayHours: 240,
        shortLeaveMaximumMinutes: 120,
        networkRestrictionEnabled: false,
        allowedIPs: ['127.0.0.1', '::1', '10.194.16.2'],
        autoCheckoutEnabled: true,
      });
      console.log('Created default attendance settings.');
    }

    // 2. Departments
    const deptData = [
      { name: 'Engineering', description: 'Software Development & IT Infrastructure' },
      { name: 'Human Resources', description: 'People Operations & Talent Acquisition' },
      { name: 'Operations', description: 'Daily Field & Office Logistics' },
      { name: 'Marketing', description: 'Growth, Digital & Brand Strategy' },
      { name: 'Finance & Accounts', description: 'Payroll, Billing & Auditing' }
    ];

    const departments = {};
    for (const d of deptData) {
      let dept = await Department.findOne({ name: d.name });
      if (!dept) {
        dept = await Department.create(d);
      }
      departments[d.name] = dept._id;
    }
    console.log('Departments seeded/verified.');

    // 3. Holidays
    const holidaysData = [
      { name: 'Republic Day', date: '2026-01-26', type: 'National', description: 'National Holiday' },
      { name: 'Holi Festival', date: '2026-03-04', type: 'Company', description: 'Spring Festival of Colours' },
      { name: 'Independence Day', date: '2026-08-15', type: 'National', description: 'National Holiday' },
      { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'National', description: 'National Holiday' },
      { name: 'Diwali', date: '2026-11-08', type: 'Company', description: 'Festival of Lights' },
      { name: 'Christmas', date: '2026-12-25', type: 'Company', description: 'Christmas Day' },
    ];
    for (const h of holidaysData) {
      const exists = await Holiday.findOne({ date: h.date });
      if (!exists) {
        await Holiday.create(h);
      }
    }
    console.log('Holidays seeded/verified.');

    // 4. Admin User
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = new User({
        employeeId: 'ADM001',
        name: 'System Admin',
        username: 'admin',
        email: 'admin@devbhoomi.local',
        password: 'SecureAdminPassword123!',
        role: 'admin',
        status: 'Active',
      });
      await admin.save();
      console.log('Admin user created.');
    }

    // 5. Employees
    const sampleEmployees = [
      {
        employeeId: 'EMP001',
        name: 'Gaurav Bhatt',
        username: 'Gaurii',
        email: 'bhattg439@gmail.com',
        phone: '9058085467',
        password: 'Employee123!',
        department: departments['Engineering'],
        designation: 'Lead Software Engineer',
        status: 'Active'
      },
      {
        employeeId: 'EMP002',
        name: 'Aarav Sharma',
        username: 'aarav.sharma',
        email: 'aarav@devbhoomi.local',
        phone: '9876543210',
        password: 'Employee123!',
        department: departments['Engineering'],
        designation: 'Senior Frontend Developer',
        status: 'Active'
      },
      {
        employeeId: 'EMP003',
        name: 'Priya Joshi',
        username: 'priya.joshi',
        email: 'priya@devbhoomi.local',
        phone: '9812345678',
        password: 'Employee123!',
        department: departments['Human Resources'],
        designation: 'HR Executive',
        status: 'Active'
      },
      {
        employeeId: 'EMP004',
        name: 'Rohan Verma',
        username: 'rohan.verma',
        email: 'rohan@devbhoomi.local',
        phone: '9923456789',
        password: 'Employee123!',
        department: departments['Operations'],
        designation: 'Operations Manager',
        status: 'Active'
      },
      {
        employeeId: 'EMP005',
        name: 'Ananya Negi',
        username: 'ananya.negi',
        email: 'ananya@devbhoomi.local',
        phone: '9734567890',
        password: 'Employee123!',
        department: departments['Marketing'],
        designation: 'Growth Marketing Specialist',
        status: 'Active'
      },
      {
        employeeId: 'EMP006',
        name: 'Deepak Rawat',
        username: 'deepak.rawat',
        email: 'deepak@devbhoomi.local',
        phone: '9645678901',
        password: 'Employee123!',
        department: departments['Finance & Accounts'],
        designation: 'Accounts Officer',
        status: 'Active'
      }
    ];

    const createdEmployees = [];
    for (const empData of sampleEmployees) {
      let emp = await User.findOne({ $or: [{ employeeId: empData.employeeId }, { username: empData.username }, { email: empData.email }] });
      if (!emp) {
        emp = new User({ ...empData, role: 'employee' });
        await emp.save();
        console.log(`Created employee: ${emp.name}`);
      } else {
        // update department/designation if missing
        if (!emp.department && empData.department) emp.department = empData.department;
        if (!emp.designation && empData.designation) emp.designation = empData.designation;
        await emp.save();
      }
      createdEmployees.push(emp);
    }

    // 6. Seed Attendance records for the past 7 days up to today
    const today = moment().format('YYYY-MM-DD');
    console.log(`Today's date is: ${today}`);

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const dateStr = moment().subtract(dayOffset, 'days').format('YYYY-MM-DD');

      for (let i = 0; i < createdEmployees.length; i++) {
        const emp = createdEmployees[i];
        const existing = await Attendance.findOne({ employee: emp._id, date: dateStr });

        if (!existing) {
          // Employee 5 is absent on dayOffset 0, Employee 4 on leave
          if (dayOffset === 0 && i === 4) {
            continue; // Will show as absent or on leave
          }

          const isLate = (i % 3 === 2); // some employees late for realistic testing
          const checkInHour = isLate ? 10 : 9;
          const checkInMinute = isLate ? 15 : Math.floor(Math.random() * 20) + 10;
          const checkInDate = moment(`${dateStr} ${checkInHour}:${checkInMinute}:00`, 'YYYY-MM-DD HH:mm:ss').toDate();

          // Check out if past day or if dayOffset === 0 for some
          let checkOutDate = null;
          let workingHours = 0;
          if (dayOffset > 0 || i <= 2) {
            checkOutDate = moment(`${dateStr} 18:30:00`, 'YYYY-MM-DD HH:mm:ss').toDate();
            workingHours = moment(checkOutDate).diff(moment(checkInDate), 'minutes');
          }

          await Attendance.create({
            employee: emp._id,
            date: dateStr,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            workingHours,
            attendanceType: 'Present',
            late: isLate,
            lateMinutes: isLate ? 35 : 0,
            status: 'Approved',
            networkAuthorized: true,
            ipAddress: '127.0.0.1',
          });
        }
      }
    }
    console.log('Attendance records seeded.');

    // 7. Seed Sample Leaves
    const leaveCount = await Leave.countDocuments();
    if (leaveCount === 0 && createdEmployees.length >= 2) {
      const today = moment().format('YYYY-MM-DD');
      const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
      const nextWeek = moment().add(7, 'days').format('YYYY-MM-DD');

      await Leave.create([
        {
          employee: createdEmployees[1]._id,
          leaveType: 'Casual Leave',
          startDate: today,
          endDate: tomorrow,
          reason: 'Attending family religious ceremony in hometown',
          status: 'Approved',
          approvedBy: admin._id,
          approvedAt: new Date(),
        },
        {
          employee: createdEmployees[2]._id,
          leaveType: 'Sick Leave',
          startDate: today,
          endDate: today,
          reason: 'Severe seasonal flu and fever, advised bed rest',
          status: 'Pending',
        },
        {
          employee: createdEmployees[3]._id,
          leaveType: 'Casual Leave',
          startDate: nextWeek,
          endDate: moment(nextWeek).add(2, 'days').format('YYYY-MM-DD'),
          reason: 'Personal vacation scheduled in advance',
          status: 'Pending',
        },
        {
          employee: createdEmployees[0]._id,
          leaveType: 'Short Leave',
          startDate: today,
          endDate: today,
          startTime: '14:00',
          endTime: '16:00',
          reason: 'Urgent bank work for KYC documentation',
          status: 'Approved',
          approvedBy: admin._id,
          approvedAt: new Date(),
        }
      ]);
      console.log('Leave requests seeded.');
    }

    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDatabase();
