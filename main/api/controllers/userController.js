const fs = require('fs');
const csv = require('csv-parser');
const { google } = require('googleapis');
const { getDB } = require('../config/database');

const generateRandomString = (length) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomString = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        randomString += charset[randomIndex];
    }
    return randomString;
};

const generateRandomEmail = (givenName, familyName, domain) => {
    const username = `${givenName.toLowerCase()}.${familyName.toLowerCase()}`;
    return `${username}@${domain}`;
};

const generateUserList = async (req, res) => {
    try {
        const { domain, numRecords } = req.body;

        if (!domain || !numRecords) {
            return res.status(400).json({ error: 'Domain and numRecords are required' });
        }

        const namesFilePath = '../../files/names.csv';
        
        // Read names from CSV
        const names = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(namesFilePath)
                .pipe(csv())
                .on('data', (row) => {
                    names.push(row);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (names.length === 0) {
            return res.status(400).json({ error: 'Names file is empty or invalid' });
        }

        // Generate users
        const users = [];
        const generatedEmails = new Set();
        const fixedPassword = 'Password123@';

        let count = 0;
        while (count < numRecords) {
            const nameIndex = Math.floor(Math.random() * names.length);
            const givenName = names[nameIndex].givenName || names[nameIndex].given_name || 'User';
            const familyName = names[nameIndex].familyName || names[nameIndex].family_name || 'Name';
            const email = generateRandomEmail(givenName, familyName, domain);

            if (!generatedEmails.has(email)) {
                users.push({
                    email,
                    password: fixedPassword,
                    givenName,
                    familyName
                });
                generatedEmails.add(email);
                count++;
            }
        }

        // Save to database
        const db = getDB();
        await db.collection('generated_users').insertMany(
            users.map(user => ({ ...user, createdAt: new Date() }))
        );

        // Also save to CSV file for compatibility
        const csvContent = 'email,password,givenName,familyName\n' + 
            users.map(u => `${u.email},${u.password},${u.givenName},${u.familyName}`).join('\n');
        fs.writeFileSync('../../files/user_list.csv', csvContent);

        res.json({
            message: 'User list generated successfully',
            count: users.length,
            users: users.slice(0, 10) // Return first 10 as preview
        });
    } catch (error) {
        console.error('Generate user list error:', error);
        res.status(500).json({ error: 'Failed to generate user list' });
    }
};

const createGoogleUsers = async (req, res) => {
    try {
        const credPath = './cred.json';
        if (!fs.existsSync(credPath)) {
            return res.status(400).json({ error: 'Google credentials file not found' });
        }

        const privateKey = require(credPath);
        const adminUser = process.env.GOOGLE_ADMIN_USER || "admin@decieodom.com";

        const jwtClient = new google.auth.JWT(
            privateKey.client_email,
            null,
            privateKey.private_key,
            ['https://www.googleapis.com/auth/admin.directory.user'],
            adminUser
        );

        // Read users from database or CSV
        const db = getDB();
        const users = await db.collection('generated_users')
            .find({ googleCreated: { $ne: true } })
            .limit(100)
            .toArray();

        if (users.length === 0) {
            return res.status(400).json({ error: 'No users to create' });
        }

        const admin = google.admin({ version: 'directory_v1', auth: jwtClient });
        const results = { success: 0, failed: 0, errors: [] };

        for (const user of users) {
            try {
                await admin.users.insert({
                    auth: jwtClient,
                    resource: {
                        primaryEmail: user.email,
                        password: user.password,
                        name: {
                            givenName: user.givenName,
                            familyName: user.familyName
                        },
                        changePasswordAtNextLogin: false
                    }
                });

                // Mark as created
                await db.collection('generated_users').updateOne(
                    { _id: user._id },
                    { $set: { googleCreated: true, googleCreatedAt: new Date() } }
                );

                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({ email: user.email, error: error.message });
            }
        }

        res.json({
            message: 'User creation process completed',
            results
        });
    } catch (error) {
        console.error('Create Google users error:', error);
        res.status(500).json({ error: 'Failed to create Google users' });
    }
};

const deleteGoogleUsers = async (req, res) => {
    try {
        const credPath = './cred.json';
        if (!fs.existsSync(credPath)) {
            return res.status(400).json({ error: 'Google credentials file not found' });
        }

        const privateKey = require(credPath);
        const adminEmail = process.env.GOOGLE_ADMIN_USER || "admin@decieodom.com";

        const jwtClient = new google.auth.JWT(
            privateKey.client_email,
            null,
            privateKey.private_key,
            ['https://www.googleapis.com/auth/admin.directory.user'],
            adminEmail
        );

        const admin = google.admin({ version: 'directory_v1', auth: jwtClient });
        const usersToDelete = [];

        // Get all users
        let pageToken = null;
        do {
            const response = await admin.users.list({
                customer: 'my_customer',
                auth: jwtClient,
                maxResults: 100,
                pageToken: pageToken
            });

            if (response.data.users) {
                response.data.users.forEach((user) => {
                    if (user.primaryEmail !== adminEmail) {
                        usersToDelete.push(user.id);
                    }
                });
            }

            pageToken = response.data.nextPageToken;
        } while (pageToken);

        // Delete users
        const results = { success: 0, failed: 0 };
        for (const userId of usersToDelete) {
            try {
                await admin.users.delete({
                    userKey: userId,
                    auth: jwtClient
                });
                results.success++;
            } catch (error) {
                results.failed++;
            }
        }

        res.json({
            message: 'User deletion process completed',
            results
        });
    } catch (error) {
        console.error('Delete Google users error:', error);
        res.status(500).json({ error: 'Failed to delete Google users' });
    }
};

const getGeneratedUsers = async (req, res) => {
    try {
        const db = getDB();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const users = await db.collection('generated_users')
            .find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await db.collection('generated_users').countDocuments();

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
};

module.exports = {
    generateUserList,
    createGoogleUsers,
    deleteGoogleUsers,
    getGeneratedUsers
};
