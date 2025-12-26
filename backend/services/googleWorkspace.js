const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleWorkspaceService {
    constructor() {
        this.adminEmail = process.env.GOOGLE_ADMIN_EMAIL;
        this.credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || 
                               path.join(__dirname, '../config/cred.json');
        this.jwtClient = null;
    }

    // Initialize the JWT client
    async initialize() {
        try {
            if (!fs.existsSync(this.credentialsPath)) {
                throw new Error('Google credentials file not found. Please configure cred.json');
            }

            const privateKey = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
            
            this.jwtClient = new google.auth.JWT(
                privateKey.client_email,
                null,
                privateKey.private_key,
                ['https://www.googleapis.com/auth/admin.directory.user'],
                this.adminEmail
            );

            await this.jwtClient.authorize();
            return true;
        } catch (error) {
            console.error('Failed to initialize Google Workspace service:', error);
            throw error;
        }
    }

    // Get authenticated admin client
    getAdminClient() {
        return google.admin({
            version: 'directory_v1',
            auth: this.jwtClient
        });
    }

    // Create a single user
    async createUser(userData) {
        try {
            if (!this.jwtClient) {
                await this.initialize();
            }

            const admin = this.getAdminClient();
            
            const response = await admin.users.insert({
                requestBody: {
                    primaryEmail: userData.email,
                    password: userData.password,
                    name: {
                        givenName: userData.givenName,
                        familyName: userData.familyName
                    },
                    changePasswordAtNextLogin: userData.changePasswordAtNextLogin || false
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error creating user:', error.message);
            throw error;
        }
    }

    // Create multiple users
    async createUsers(usersData, progressCallback) {
        const results = {
            success: [],
            failed: []
        };

        for (let i = 0; i < usersData.length; i++) {
            try {
                const user = usersData[i];
                const result = await this.createUser(user);
                results.success.push({
                    email: user.email,
                    data: result
                });

                if (progressCallback) {
                    progressCallback({
                        current: i + 1,
                        total: usersData.length,
                        status: 'success',
                        email: user.email
                    });
                }
            } catch (error) {
                results.failed.push({
                    email: usersData[i].email,
                    error: error.message
                });

                if (progressCallback) {
                    progressCallback({
                        current: i + 1,
                        total: usersData.length,
                        status: 'failed',
                        email: usersData[i].email,
                        error: error.message
                    });
                }
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 250));
        }

        return results;
    }

    // List all users
    async listUsers(options = {}) {
        try {
            if (!this.jwtClient) {
                await this.initialize();
            }

            const admin = this.getAdminClient();
            
            const response = await admin.users.list({
                customer: 'my_customer',
                maxResults: options.maxResults || 100,
                pageToken: options.pageToken,
                orderBy: options.orderBy || 'email'
            });

            return {
                users: response.data.users || [],
                nextPageToken: response.data.nextPageToken
            };
        } catch (error) {
            console.error('Error listing users:', error.message);
            throw error;
        }
    }

    // Delete a single user
    async deleteUser(userKey) {
        try {
            if (!this.jwtClient) {
                await this.initialize();
            }

            const admin = this.getAdminClient();
            
            await admin.users.delete({
                userKey: userKey
            });

            return { success: true, userKey };
        } catch (error) {
            console.error('Error deleting user:', error.message);
            throw error;
        }
    }

    // Delete multiple users (excluding admin)
    async deleteAllUsers(progressCallback) {
        try {
            if (!this.jwtClient) {
                await this.initialize();
            }

            const admin = this.getAdminClient();
            const usersToDelete = [];
            let pageToken = null;

            // Fetch all users
            do {
                const response = await admin.users.list({
                    customer: 'my_customer',
                    maxResults: 100,
                    pageToken: pageToken
                });

                const users = response.data.users || [];
                users.forEach(user => {
                    if (user.primaryEmail !== this.adminEmail) {
                        usersToDelete.push(user.id);
                    }
                });

                pageToken = response.data.nextPageToken;
            } while (pageToken);

            const results = {
                success: [],
                failed: [],
                total: usersToDelete.length
            };

            // Delete users one by one
            for (let i = 0; i < usersToDelete.length; i++) {
                try {
                    await admin.users.delete({
                        userKey: usersToDelete[i]
                    });

                    results.success.push(usersToDelete[i]);

                    if (progressCallback) {
                        progressCallback({
                            current: i + 1,
                            total: usersToDelete.length,
                            status: 'success',
                            userId: usersToDelete[i]
                        });
                    }
                } catch (error) {
                    results.failed.push({
                        userId: usersToDelete[i],
                        error: error.message
                    });

                    if (progressCallback) {
                        progressCallback({
                            current: i + 1,
                            total: usersToDelete.length,
                            status: 'failed',
                            userId: usersToDelete[i],
                            error: error.message
                        });
                    }
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 250));
            }

            return results;
        } catch (error) {
            console.error('Error deleting users:', error.message);
            throw error;
        }
    }

    // Generate user data
    generateUserData(names, domain, count) {
        const users = [];
        const generatedEmails = new Set();
        const fixedPassword = 'Password123@';

        while (users.length < count && names.length > 0) {
            const givenNameIndex = Math.floor(Math.random() * names.length);
            const familyNameIndex = Math.floor(Math.random() * names.length);
            
            const givenName = names[givenNameIndex].givenName;
            const familyName = names[familyNameIndex].familyName;
            
            const email = `${givenName.toLowerCase()}.${familyName.toLowerCase()}@${domain}`;

            if (!generatedEmails.has(email)) {
                users.push({
                    email,
                    password: fixedPassword,
                    givenName,
                    familyName,
                    changePasswordAtNextLogin: false
                });
                generatedEmails.add(email);
            }
        }

        return users;
    }
}

module.exports = new GoogleWorkspaceService();
