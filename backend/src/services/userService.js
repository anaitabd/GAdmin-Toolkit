const { google } = require('googleapis');
const fs = require('fs');
const csv = require('csv-parser');
const config = require('../config');
const { logger } = require('../config/logger');

let jwtClient = null;

/**
 * Initialize Google JWT Client
 */
const initializeGoogleAuth = () => {
  try {
    if (!fs.existsSync(config.google.credentialsPath)) {
      logger.error('Google credentials file not found at:', config.google.credentialsPath);
      return null;
    }

    const privateKey = require(config.google.credentialsPath);
    
    jwtClient = new google.auth.JWT(
      privateKey.client_email,
      null,
      privateKey.private_key,
      config.google.scopes,
      config.google.adminEmail
    );

    logger.info('Google JWT Client initialized');
    return jwtClient;
  } catch (error) {
    logger.error('Failed to initialize Google Auth:', error);
    return null;
  }
};

/**
 * Get authorized admin client
 */
const getAdminClient = async () => {
  if (!jwtClient) {
    jwtClient = initializeGoogleAuth();
  }

  if (!jwtClient) {
    throw new Error('Google credentials not configured');
  }

  return new Promise((resolve, reject) => {
    jwtClient.authorize((err, tokens) => {
      if (err) {
        logger.error('Google authorization error:', err);
        reject(err);
        return;
      }

      const admin = google.admin({
        version: 'directory_v1',
        auth: jwtClient,
      });

      resolve(admin);
    });
  });
};

/**
 * Create a single user in Google Workspace
 */
const createUser = async (email, password, firstName, lastName) => {
  try {
    const admin = await getAdminClient();

    const result = await admin.users.insert({
      resource: {
        primaryEmail: email,
        password: password,
        name: {
          givenName: firstName,
          familyName: lastName,
        },
        changePasswordAtNextLogin: false,
      },
    });

    logger.info('User created successfully:', email);
    return result.data;
  } catch (error) {
    logger.error('Error creating user:', { email, error: error.message });
    throw error;
  }
};

/**
 * Delete a single user from Google Workspace
 */
const deleteUser = async (userKey) => {
  try {
    const admin = await getAdminClient();

    await admin.users.delete({
      userKey: userKey,
    });

    logger.info('User deleted successfully:', userKey);
    return { success: true, userKey };
  } catch (error) {
    logger.error('Error deleting user:', { userKey, error: error.message });
    throw error;
  }
};

/**
 * List all users in Google Workspace
 */
const listUsers = async (maxResults = 100, pageToken = null) => {
  try {
    const admin = await getAdminClient();

    const params = {
      customer: 'my_customer',
      maxResults,
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    const result = await admin.users.list(params);

    return {
      users: result.data.users || [],
      nextPageToken: result.data.nextPageToken,
    };
  } catch (error) {
    logger.error('Error listing users:', error);
    throw error;
  }
};

/**
 * Get all users (paginated)
 */
const getAllUsers = async (excludeAdmin = true) => {
  const allUsers = [];
  let pageToken = null;

  do {
    const result = await listUsers(100, pageToken);
    
    let users = result.users;
    
    // Filter out admin user if requested
    if (excludeAdmin) {
      users = users.filter(user => user.primaryEmail !== config.google.adminEmail);
    }
    
    allUsers.push(...users);
    pageToken = result.nextPageToken;
  } while (pageToken);

  return allUsers;
};

/**
 * Delete all users except admin
 */
const deleteAllUsers = async () => {
  try {
    const users = await getAllUsers(true);
    const results = [];

    for (const user of users) {
      try {
        await deleteUser(user.id);
        results.push({ success: true, userId: user.id, email: user.primaryEmail });
      } catch (error) {
        results.push({ 
          success: false, 
          userId: user.id, 
          email: user.primaryEmail, 
          error: error.message 
        });
      }
    }

    return {
      total: users.length,
      deleted: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  } catch (error) {
    logger.error('Error deleting all users:', error);
    throw error;
  }
};

/**
 * Create users from CSV data
 */
const createUsersFromCSV = async (csvPath) => {
  try {
    const users = [];

    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          users.push(row);
        })
        .on('end', () => {
          logger.info(`CSV file processed, found ${users.length} users`);
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    const results = [];

    // Create users sequentially
    for (const user of users) {
      try {
        const result = await createUser(
          user.email,
          user.password,
          user.givenName,
          user.familyName
        );
        results.push({ success: true, email: user.email, data: result });
      } catch (error) {
        results.push({ 
          success: false, 
          email: user.email, 
          error: error.message 
        });
      }
    }

    return {
      total: users.length,
      created: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  } catch (error) {
    logger.error('Error creating users from CSV:', error);
    throw error;
  }
};

/**
 * Generate random user data
 */
const generateUsers = async (domain, count) => {
  try {
    // Read names file
    const namesPath = config.files.namesPath;
    
    if (!fs.existsSync(namesPath)) {
      throw new Error('Names file not found');
    }

    const names = await new Promise((resolve, reject) => {
      const givenNames = [];
      const familyNames = [];

      fs.createReadStream(namesPath, 'utf8')
        .on('data', (data) => {
          const lines = data.trim().split('\n');
          lines.forEach(line => {
            const [givenName, familyName] = line.split(',');
            if (givenName && familyName) {
              givenNames.push(givenName.trim());
              familyNames.push(familyName.trim());
            }
          });
        })
        .on('end', () => {
          resolve({ givenNames, familyNames });
        })
        .on('error', reject);
    });

    // Generate user data
    const users = [];
    const generatedEmails = new Set();
    const fixedPassword = 'Password123@';

    while (users.length < count) {
      const givenName = names.givenNames[Math.floor(Math.random() * names.givenNames.length)];
      const familyName = names.familyNames[Math.floor(Math.random() * names.familyNames.length)];
      const email = `${givenName.toLowerCase()}.${familyName.toLowerCase()}@${domain}`;

      if (!generatedEmails.has(email)) {
        users.push({
          email,
          password: fixedPassword,
          givenName,
          familyName,
        });
        generatedEmails.add(email);
      }
    }

    // Write to CSV
    const csvContent = [
      'email,password,givenName,familyName',
      ...users.map(u => `${u.email},${u.password},${u.givenName},${u.familyName}`)
    ].join('\n');

    fs.writeFileSync(config.files.userListPath, csvContent);
    
    logger.info(`Generated ${users.length} users and saved to CSV`);
    
    return users;
  } catch (error) {
    logger.error('Error generating users:', error);
    throw error;
  }
};

module.exports = {
  initializeGoogleAuth,
  createUser,
  deleteUser,
  listUsers,
  getAllUsers,
  deleteAllUsers,
  createUsersFromCSV,
  generateUsers,
};
