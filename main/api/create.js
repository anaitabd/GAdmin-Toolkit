const { google } = require('googleapis');
const { loadGoogleCreds } = require('./googleCreds');
const { getUsers } = require('./db/queries');

const admin_user = "contact@naitabdallah.dev";

let jwtClient = null;

// Email validation helper
const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

function createUser(user, password, firstname, lastname, callback) {
    // Validate inputs
    if (!isValidEmail(user)) {
        callback(new Error(`Invalid email address: ${user}`), null);
        return;
    }
    if (!password || password.length < 8) {
        callback(new Error('Password must be at least 8 characters'), null);
        return;
    }
    if (!firstname || !lastname) {
        callback(new Error('First name and last name are required'), null);
        return;
    }

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.error('JWT authorization failed:', err.message);
            callback(err, null);
            return;
        }

        const admin = google.admin({
            version: 'directory_v1',
            auth: jwtClient
        });
        admin.users.insert({
            auth: jwtClient,
            resource: {
                primaryEmail: user,
                password: password,
                name: {
                    givenName: firstname,
                    familyName: lastname
                },
                changePasswordAtNextLogin: false
            }
        }, (err, res) => {
            if (err) {
                console.error('Error creating user:', err);
                callback(err, null);
            } else {
                callback(null, res.data);
            }
        });
    });
}

let queue = [];
let isProcessing = false;
let createdUsersCount = 0;

const loadQueue = async () => {
    const users = await getUsers();
    if (!users || users.length === 0) {
        console.error('No users found in database to create');
        process.exit(1);
    }
    
    queue = users.map((row) => ({
        email: row.email,
        password: row.password,
        givenName: row.given_name,
        familyName: row.family_name,
    }));
    
    console.log(`Loaded ${queue.length} users from database. Starting user creation...`);
    processQueue();
};

function processQueue() {
    if (queue.length === 0) {
        isProcessing = false;
        console.log(`All users processed. Total users created: ${createdUsersCount}`);
        process.exit(0);
        return;
    }

    if (isProcessing) return;

    isProcessing = true;

    const row = queue.shift();
    const user = row.email;
    const password = row.password;
    const firstname = row.givenName;
    const lastname = row.familyName;

    createUser(user, password, firstname, lastname, (err, result) => {
        if (err) {
            console.error('Error creating user:', err.response);
        } else {
            createdUsersCount++;
            console.log(`Number of users created: ${createdUsersCount}`);
        }

        isProcessing = false;
        processQueue();
    });
}

const main = async () => {
    try {
        const privateKey = await loadGoogleCreds();
        if (!privateKey || !privateKey.client_email || !privateKey.private_key) {
            throw new Error('Invalid Google credentials');
        }
        
        jwtClient = new google.auth.JWT(
            privateKey.client_email,
            null,
            privateKey.private_key,
            ['https://www.googleapis.com/auth/admin.directory.user'],
            admin_user
        );
        
        await loadQueue();
    } catch (err) {
        console.error('Failed to start user creation:', err.message);
        process.exit(1);
    }
};

main();
