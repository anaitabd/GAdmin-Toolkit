const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const serviceAccountAuth = require('./gsuite/serviceAccountAuth');

class GmailService {
  constructor(credentials) {
    this.credentials = credentials;
    this.oauth2Client = null;
    this.gmail = null;
  }

  async authenticate() {
    try {
      const { client_id, client_secret, refresh_token, access_token } = this.credentials;
      
      this.oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      this.oauth2Client.setCredentials({
        refresh_token,
        access_token
      });

      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      await this.gmail.users.getProfile({ userId: 'me' });
      logger.info('Gmail API authentication successful');
      
      return true;
    } catch (error) {
      logger.error('Gmail API authentication failed', { error: error.message });
      throw error;
    }
  }

  async sendEmail(emailData) {
    const { to, subject, html, text, from } = emailData;
    
    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      html || text
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const startTime = Date.now();
    try {
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      return {
        success: true,
        messageId: response.data.id,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  async checkBounces() {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'from:mailer-daemon@ OR from:postmaster@ is:unread',
        maxResults: 50
      });

      const bounces = [];
      if (response.data.messages) {
        for (const message of response.data.messages) {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id
          });

          bounces.push({
            id: message.id,
            snippet: detail.data.snippet,
            headers: detail.data.payload.headers
          });

          await this.gmail.users.messages.modify({
            userId: 'me',
            id: message.id,
            requestBody: {
              removeLabelIds: ['UNREAD']
            }
          });
        }
      }

      return bounces;
    } catch (error) {
      logger.error('Error checking bounces', { error: error.message });
      return [];
    }
  }
}

class SMTPService {
  constructor(credentials) {
    this.credentials = credentials;
    this.transporter = null;
  }

  async authenticate() {
    try {
      const { host, port, secure, username, password } = this.credentials;
      
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: username,
          pass: password
        }
      });

      await this.transporter.verify();
      logger.info('SMTP authentication successful');
      
      return true;
    } catch (error) {
      logger.error('SMTP authentication failed', { error: error.message });
      throw error;
    }
  }

  async sendEmail(emailData) {
    const { to, subject, html, text, from } = emailData;
    
    const startTime = Date.now();
    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html
      });

      return {
        success: true,
        messageId: info.messageId,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }
}

class GmailJWTService {
  constructor(senderAccountId) {
    this.senderAccountId = senderAccountId;
    this.gmail = null;
    this.account = null;
  }

  async authenticate() {
    try {
      // Get Gmail client with JWT authentication
      const { gmail, account } = await serviceAccountAuth.getGmailClient(this.senderAccountId);
      this.gmail = gmail;
      this.account = account;

      // Test authentication
      await this.gmail.users.getProfile({ userId: 'me' });
      logger.info('Gmail JWT authentication successful', { 
        senderAccountId: this.senderAccountId,
        email: account.email 
      });
      
      return true;
    } catch (error) {
      logger.error('Gmail JWT authentication failed', { 
        error: error.message,
        senderAccountId: this.senderAccountId 
      });
      throw error;
    }
  }

  async sendEmail(emailData) {
    const { to, subject, html, text, from } = emailData;
    
    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      html || text
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const startTime = Date.now();
    try {
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      return {
        success: true,
        messageId: response.data.id,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  async checkBounces() {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'from:mailer-daemon@ OR from:postmaster@ is:unread',
        maxResults: 50
      });

      const bounces = [];
      if (response.data.messages) {
        for (const message of response.data.messages) {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id
          });

          bounces.push({
            id: message.id,
            snippet: detail.data.snippet,
            headers: detail.data.payload.headers
          });

          await this.gmail.users.messages.modify({
            userId: 'me',
            id: message.id,
            requestBody: {
              removeLabelIds: ['UNREAD']
            }
          });
        }
      }

      return bounces;
    } catch (error) {
      logger.error('Error checking bounces', { error: error.message });
      return [];
    }
  }
}

module.exports = { GmailService, SMTPService, GmailJWTService };
