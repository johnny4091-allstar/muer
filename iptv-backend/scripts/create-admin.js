#!/usr/bin/env node

require('dotenv').config();
const readline = require('readline');
const Admin = require('../models/Admin');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         Create Admin User for IPTV Panel                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    const username = await question('Enter admin username: ');
    const password = await question('Enter admin password: ');
    const email = await question('Enter admin email (optional): ');

    if (!username || !password) {
      console.error('\n❌ Username and password are required!');
      process.exit(1);
    }

    // Check if admin already exists
    const existing = Admin.findByUsername(username);
    if (existing) {
      console.error(`\n❌ Admin user "${username}" already exists!`);
      process.exit(1);
    }

    const adminId = Admin.create({
      username,
      password,
      email: email || null,
      role: 'admin'
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`\nAdmin ID: ${adminId}`);
    console.log(`Username: ${username}`);
    console.log('\nYou can now login to the admin panel.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
