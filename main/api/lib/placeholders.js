/**
 * Placeholder Replacement Engine
 * Mirrors iresponse-pro's placeholder system from send-process.js
 * 
 * Supported placeholders:
 * 
 * Recipient data:
 *   [to]           → email username (before @)
 *   [email]        → full email address
 *   [first_name]   → from email_data.first_name
 *   [last_name]    → from email_data.last_name
 *   [full_name]    → first_name + last_name
 * 
 * Dynamic:
 *   [date]         → YYYY-MM-DD
 *   [datetime]     → YYYY-MM-DD HH:MM:SS
 *   [timestamp]    → Unix timestamp
 *   [random]       → random 8-char string
 *   [random_N]     → random N-char string (e.g., [random_16])
 *   [md5]          → MD5 of recipient email
 * 
 * Tracking (auto-generated):
 *   [click_url]    → wrapped click tracking URL
 *   [unsub_url]    → wrapped unsub tracking URL
 *   [open_pixel]   → 1x1 tracking pixel img tag
 *   [unsub_link]   → full <a> unsub link
 * 
 * Offer data:
 *   [offer_name]   → offer.name
 *   [from_name]    → selected from_name value
 *   [subject]      → selected subject value
 */

const crypto = require('crypto');

/**
 * Generate a random alphanumeric string
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
function generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate MD5 hash of a string
 * @param {string} input - Input string
 * @returns {string} - MD5 hash
 */
function md5Hash(input) {
    return crypto.createHash('md5').update(input).digest('hex');
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} - Formatted date
 */
function formatDate(date = new Date()) {
    return date.toISOString().split('T')[0];
}

/**
 * Format datetime as YYYY-MM-DD HH:MM:SS
 * @param {Date} date - Date object
 * @returns {string} - Formatted datetime
 */
function formatDateTime(date = new Date()) {
    return date.toISOString().replace('T', ' ').split('.')[0];
}

/**
 * Personalize HTML content with recipient and context data
 * @param {string} template - HTML string with placeholders
 * @param {Object} recipient - { to_email, first_name, last_name, email_md5, geo, ... }
 * @param {Object} context - { offer, creative, fromName, subject, trackingBaseUrl, clickTrackId, openTrackId, unsubTrackId }
 * @returns {string} - Personalized HTML string
 */
function personalizeContent(template, recipient, context = {}) {
    let html = template;
    
    // Recipient data placeholders
    const toUsername = recipient.to_email ? recipient.to_email.split('@')[0] : '';
    const firstName = recipient.first_name || toUsername;
    const lastName = recipient.last_name || '';
    const fullName = firstName + (lastName ? ' ' + lastName : '');
    
    html = html.replace(/\[to\]/g, toUsername);
    html = html.replace(/\[email\]/g, recipient.to_email || '');
    html = html.replace(/\[first_name\]/g, firstName);
    html = html.replace(/\[last_name\]/g, lastName);
    html = html.replace(/\[full_name\]/g, fullName);
    
    // Dynamic placeholders
    const now = new Date();
    html = html.replace(/\[date\]/g, formatDate(now));
    html = html.replace(/\[datetime\]/g, formatDateTime(now));
    html = html.replace(/\[timestamp\]/g, Math.floor(now.getTime() / 1000).toString());
    
    // Handle [random_N] patterns (e.g., [random_16])
    html = html.replace(/\[random_(\d+)\]/g, (match, length) => {
        return generateRandomString(parseInt(length, 10));
    });
    
    // Handle generic [random] (8 chars)
    html = html.replace(/\[random\]/g, generateRandomString(8));
    
    // MD5 of recipient email
    const emailMd5 = recipient.email_md5 || (recipient.to_email ? md5Hash(recipient.to_email) : '');
    html = html.replace(/\[md5\]/g, emailMd5);
    
    // Tracking placeholders
    if (context.trackingBaseUrl) {
        if (context.clickTrackId) {
            const clickUrl = `${context.trackingBaseUrl}/t/c/${context.clickTrackId}`;
            html = html.replace(/\[click_url\]/g, clickUrl);
        }
        
        if (context.unsubTrackId) {
            const unsubUrl = `${context.trackingBaseUrl}/t/c/${context.unsubTrackId}`;
            html = html.replace(/\[unsub_url\]/g, unsubUrl);
            
            // Generate full unsub link
            const unsubLink = `<a href="${unsubUrl}">Unsubscribe</a>`;
            html = html.replace(/\[unsub_link\]/g, unsubLink);
        }
        
        if (context.openTrackId) {
            const openPixel = `<img src="${context.trackingBaseUrl}/t/o/${context.openTrackId}" alt="" width="1" height="1" style="display:block" />`;
            html = html.replace(/\[open_pixel\]/g, openPixel);
        }
    }
    
    // Offer data placeholders
    if (context.offer) {
        html = html.replace(/\[offer_name\]/g, context.offer.name || '');
    }
    
    if (context.fromName) {
        html = html.replace(/\[from_name\]/g, context.fromName);
    }
    
    if (context.subject) {
        html = html.replace(/\[subject\]/g, context.subject);
    }
    
    return html;
}

/**
 * Personalize subject line with recipient and context data
 * @param {string} template - Subject line with placeholders
 * @param {Object} recipient - { to_email, first_name, last_name, email_md5, geo, ... }
 * @param {Object} context - { offer, creative, fromName, subject }
 * @returns {string} - Personalized subject line (no HTML tags)
 */
function personalizeSubject(template, recipient, context = {}) {
    let subject = template;
    
    // Recipient data placeholders
    const toUsername = recipient.to_email ? recipient.to_email.split('@')[0] : '';
    const firstName = recipient.first_name || toUsername;
    const lastName = recipient.last_name || '';
    const fullName = firstName + (lastName ? ' ' + lastName : '');
    
    subject = subject.replace(/\[to\]/g, toUsername);
    subject = subject.replace(/\[email\]/g, recipient.to_email || '');
    subject = subject.replace(/\[first_name\]/g, firstName);
    subject = subject.replace(/\[last_name\]/g, lastName);
    subject = subject.replace(/\[full_name\]/g, fullName);
    
    // Dynamic placeholders
    const now = new Date();
    subject = subject.replace(/\[date\]/g, formatDate(now));
    subject = subject.replace(/\[datetime\]/g, formatDateTime(now));
    subject = subject.replace(/\[timestamp\]/g, Math.floor(now.getTime() / 1000).toString());
    
    // Handle [random_N] patterns
    subject = subject.replace(/\[random_(\d+)\]/g, (match, length) => {
        return generateRandomString(parseInt(length, 10));
    });
    
    // Handle generic [random]
    subject = subject.replace(/\[random\]/g, generateRandomString(8));
    
    // MD5 of recipient email
    const emailMd5 = recipient.email_md5 || (recipient.to_email ? md5Hash(recipient.to_email) : '');
    subject = subject.replace(/\[md5\]/g, emailMd5);
    
    // Offer data placeholders
    if (context.offer) {
        subject = subject.replace(/\[offer_name\]/g, context.offer.name || '');
    }
    
    if (context.fromName) {
        subject = subject.replace(/\[from_name\]/g, context.fromName);
    }
    
    return subject;
}

/**
 * Get a list of all placeholders found in a template
 * @param {string} template - Template string
 * @returns {Array<string>} - List of unique placeholders found
 */
function extractPlaceholders(template) {
    const pattern = /\[([^\]]+)\]/g;
    const matches = template.match(pattern) || [];
    return [...new Set(matches)];
}

/**
 * Validate that all placeholders in a template are supported
 * @param {string} template - Template string
 * @returns {Object} - { valid: boolean, unsupported: Array<string> }
 */
function validatePlaceholders(template) {
    const supported = [
        '[to]', '[email]', '[first_name]', '[last_name]', '[full_name]',
        '[date]', '[datetime]', '[timestamp]', '[random]', '[md5]',
        '[click_url]', '[unsub_url]', '[open_pixel]', '[unsub_link]',
        '[offer_name]', '[from_name]', '[subject]'
    ];
    
    const found = extractPlaceholders(template);
    const unsupported = [];
    
    for (const placeholder of found) {
        // Check if it's a [random_N] pattern
        if (/\[random_\d+\]/.test(placeholder)) {
            continue;
        }
        
        if (!supported.includes(placeholder)) {
            unsupported.push(placeholder);
        }
    }
    
    return {
        valid: unsupported.length === 0,
        unsupported
    };
}

module.exports = {
    personalizeContent,
    personalizeSubject,
    extractPlaceholders,
    validatePlaceholders,
    generateRandomString,
    md5Hash,
    formatDate,
    formatDateTime
};
