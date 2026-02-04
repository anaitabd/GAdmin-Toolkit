const { query } = require('../../db');
const logger = require('../../utils/logger');

class UserGeneratorService {
  constructor() {
    // Common first and last names for generating fake users
    this.firstNames = [
      'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
      'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
      'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
      'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
      'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'
    ];

    this.lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
      'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
      'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
    ];
  }

  /**
   * Generate a random email address
   * @param {string} givenName - First name
   * @param {string} familyName - Last name
   * @param {string} domain - Domain name
   * @returns {string} - Generated email
   */
  generateEmail(givenName, familyName, domain) {
    const username = `${givenName.toLowerCase()}.${familyName.toLowerCase()}`;
    return `${username}@${domain}`;
  }

  /**
   * Generate random users
   * @param {number} domainId - Domain ID
   * @param {number} count - Number of users to generate
   * @param {string} password - Password for all users
   * @returns {Array} - Generated users
   */
  async generateUsers(domainId, count, password = 'Password123@') {
    try {
      // Get domain details
      const domainResult = await query(
        'SELECT domain FROM gsuite_domains WHERE id = $1',
        [domainId]
      );

      if (domainResult.rows.length === 0) {
        throw new Error(`Domain ${domainId} not found`);
      }

      const domain = domainResult.rows[0].domain;
      const users = [];
      const generatedEmails = new Set();

      // Get existing emails to avoid duplicates
      const existingResult = await query(
        'SELECT email FROM gsuite_users WHERE gsuite_domain_id = $1',
        [domainId]
      );
      existingResult.rows.forEach(row => generatedEmails.add(row.email));

      let generated = 0;
      let attempts = 0;
      const maxAttempts = count * 10; // Prevent infinite loop

      while (generated < count && attempts < maxAttempts) {
        attempts++;

        const givenName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
        const familyName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
        const email = this.generateEmail(givenName, familyName, domain);

        // Check for duplicates
        if (!generatedEmails.has(email)) {
          users.push({
            email,
            givenName,
            familyName,
            password,
            domainId
          });
          generatedEmails.add(email);
          generated++;
        }
      }

      if (generated < count) {
        logger.warn('Could not generate all unique users', { 
          requested: count, 
          generated 
        });
      }

      logger.info('Users generated', { count: users.length, domainId });
      return users;
    } catch (error) {
      logger.error('Failed to generate users', { error: error.message });
      throw error;
    }
  }

  /**
   * Save generated users to database
   * @param {Array} users - Array of user objects
   * @returns {Array} - Saved user records
   */
  async saveUsersToDB(users) {
    try {
      const savedUsers = [];

      for (const user of users) {
        const result = await query(
          `INSERT INTO gsuite_users 
           (gsuite_domain_id, email, given_name, family_name, password_hash, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')
           RETURNING *`,
          [user.domainId, user.email, user.givenName, user.familyName, user.password]
        );
        savedUsers.push(result.rows[0]);
      }

      logger.info('Users saved to database', { count: savedUsers.length });
      return savedUsers;
    } catch (error) {
      logger.error('Failed to save users to database', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate and save users in one operation
   * @param {number} domainId - Domain ID
   * @param {number} count - Number of users
   * @param {string} password - Password for all users
   * @returns {Array} - Saved users
   */
  async generateAndSave(domainId, count, password = 'Password123@') {
    const users = await this.generateUsers(domainId, count, password);
    return await this.saveUsersToDB(users);
  }
}

module.exports = new UserGeneratorService();
