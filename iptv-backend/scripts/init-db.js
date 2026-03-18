#!/usr/bin/env node

require('dotenv').config();
const Admin = require('../models/Admin');
const Category = require('../models/Category');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         Initialize IPTV Panel Database                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

try {
  // Check if admin already exists
  const existingAdmin = Admin.findByUsername(process.env.ADMIN_USERNAME || 'admin');

  if (!existingAdmin) {
    // Create default admin
    const adminId = Admin.create({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      role: 'admin'
    });

    console.log('✅ Default admin user created');
    console.log(`   Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('   ⚠️  CHANGE THE PASSWORD AFTER FIRST LOGIN!\n');
  } else {
    console.log('ℹ️  Admin user already exists, skipping...\n');
  }

  // Create default categories
  const liveCategories = ['Entertainment', 'Sports', 'News', 'Movies', 'Kids'];
  const vodCategories = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi'];

  liveCategories.forEach(name => {
    try {
      const existing = Category.getAll().find(c => c.name === name && c.type === 'live');
      if (!existing) {
        Category.create({ name, type: 'live' });
        console.log(`✅ Created live category: ${name}`);
      }
    } catch (error) {
      // Category might already exist
    }
  });

  vodCategories.forEach(name => {
    try {
      const existing = Category.getAll().find(c => c.name === name && c.type === 'vod');
      if (!existing) {
        Category.create({ name, type: 'vod' });
        console.log(`✅ Created VOD category: ${name}`);
      }
    } catch (error) {
      // Category might already exist
    }
  });

  console.log('\n✅ Database initialized successfully!\n');
  console.log('You can now start the server with: npm start\n');

} catch (error) {
  console.error('❌ Error initializing database:', error.message);
  process.exit(1);
}
