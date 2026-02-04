const { MongoClient } = require('mongodb');

let db = null;
let client = null;

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        const dbName = process.env.DB_NAME || 'gadmin-toolkit';

        client = new MongoClient(mongoURI);
        await client.connect();
        db = client.db(dbName);
        
        console.log(`Successfully connected to MongoDB: ${dbName}`);
        
        // Create indexes for better performance
        await db.collection('admin').createIndex({ username: 1 }, { unique: true });
        await db.collection('email_logs').createIndex({ timestamp: -1 });
        await db.collection('bounced_emails').createIndex({ email: 1 }, { unique: true });
        
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Don't exit process, allow server to run without DB for basic operations
        console.warn('Server running without database connection');
    }
};

const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return db;
};

const closeDB = async () => {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
};

module.exports = { connectDB, getDB, closeDB };
