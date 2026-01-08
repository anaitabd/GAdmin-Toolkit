const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const setupAdmin = async () => {
    console.log('=== GAdmin Toolkit - Admin Setup ===\n');

    // Get environment variables
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.DB_NAME || 'gadmin-toolkit';
    
    // Get admin credentials from environment or command line
    const username = process.env.ADMIN_USERNAME || process.argv[2] || 'admin';
    const password = process.env.ADMIN_PASSWORD || process.argv[3];

    if (!password) {
        console.error('Error: Password is required!');
        console.log('\nUsage:');
        console.log('  node setup-admin.js <username> <password>');
        console.log('  or set ADMIN_USERNAME and ADMIN_PASSWORD in .env');
        console.log('\nExample:');
        console.log('  node setup-admin.js admin MySecurePassword123!');
        process.exit(1);
    }

    let client;
    try {
        // Connect to MongoDB
        console.log(`Connecting to MongoDB at ${mongoURI}...`);
        client = new MongoClient(mongoURI);
        await client.connect();
        const db = client.db(dbName);
        console.log('✓ Connected to MongoDB\n');

        // Check if admin already exists
        const adminsCollection = db.collection('admin');
        const existingAdmin = await adminsCollection.findOne({ username });

        if (existingAdmin) {
            console.log(`⚠ Admin user '${username}' already exists.`);
            console.log('If you want to reset the password, delete the existing admin first.');
            process.exit(0);
        }

        // Hash password
        console.log('Hashing password...');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('✓ Password hashed\n');

        // Create admin user
        console.log('Creating admin user...');
        const result = await adminsCollection.insertOne({
            username,
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date(),
            lastLogin: null
        });

        console.log('✓ Admin user created successfully!\n');
        console.log('Admin Details:');
        console.log(`  Username: ${username}`);
        console.log(`  ID: ${result.insertedId}`);
        console.log(`  Created: ${new Date().toISOString()}\n`);

        console.log('You can now login using:');
        console.log(`  POST http://localhost:3000/api/auth/login`);
        console.log(`  { "username": "${username}", "password": "<your-password>" }\n`);

        console.log('✓ Setup complete!');
    } catch (error) {
        console.error('Error during setup:', error.message);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('\nMongoDB connection closed.');
        }
    }
};

setupAdmin();
