const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const existingAdmin = await User.findOne({ email: 'admin@mall242.com' });
    
    if (existingAdmin) {
      console.log('Admin already exists!');
      console.log('Email: admin@mall242.com');
      console.log('Password: Admin123456');
      process.exit();
      return;
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123456', salt);
    
    const admin = new User({
      name: 'Super Admin',
      email: 'admin@mall242.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      referralCode: 'ADMIN123',
      vipStatus: true,
      earlyAccessGranted: true,
    });
    
    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@mall242.com');
    console.log('🔑 Password: Admin123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();