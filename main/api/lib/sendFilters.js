/**
 * Send Filters Library
 * Provides filtering and content selection functions for email sending
 */
const { query } = require('../db');

/**
 * Filter recipients to remove blacklisted, suppressed, and bounced emails
 * @param {Array} emailDataRows - Array of email_data rows with to_email field
 * @param {number|null} offerId - Optional offer ID for suppression filtering
 * @returns {Promise<Array>} - Filtered array of email_data rows
 */
async function filterRecipients(emailDataRows, offerId = null) {
    if (!emailDataRows || emailDataRows.length === 0) {
        return [];
    }

    const emails = emailDataRows.map(row => row.to_email);

    // Get all emails to exclude
    const exclusions = new Set();

    // 1. Get blacklisted emails (from all active blacklists)
    const blacklistResult = await query(
        `SELECT DISTINCT be.email 
         FROM blacklist_emails be
         JOIN blacklists b ON b.id = be.blacklist_id
         WHERE b.status = 'active' AND be.email = ANY($1::text[])`,
        [emails]
    );
    blacklistResult.rows.forEach(row => exclusions.add(row.email.toLowerCase()));

    // 2. Get suppressed emails for this specific offer
    if (offerId) {
        const suppressionResult = await query(
            `SELECT email FROM suppression_emails
             WHERE offer_id = $1 AND email = ANY($2::text[])`,
            [offerId, emails]
        );
        suppressionResult.rows.forEach(row => exclusions.add(row.email.toLowerCase()));
    }

    // 3. Get unsubscribed emails
    const unsubResult = await query(
        `SELECT email FROM unsubscribes WHERE email = ANY($1::text[])`,
        [emails]
    );
    unsubResult.rows.forEach(row => exclusions.add(row.email.toLowerCase()));

    // Filter out excluded emails and those with problematic flags
    return emailDataRows.filter(row => {
        const email = row.to_email.toLowerCase();
        
        // Exclude if in any exclusion list
        if (exclusions.has(email)) return false;
        
        // Exclude if has problematic flags
        if (row.is_hard_bounced) return false;
        if (row.is_unsub) return false;
        if (row.is_optout) return false;
        
        return true;
    });
}

/**
 * Pick a random active creative for an offer
 * @param {number} offerId - Offer ID
 * @returns {Promise<Object|null>} - Creative object or null
 */
async function pickCreative(offerId) {
    const result = await query(
        `SELECT id, subject, from_name, html_content
         FROM creatives
         WHERE offer_id = $1 AND status = 'active'
         ORDER BY RANDOM()
         LIMIT 1`,
        [offerId]
    );

    if (result.rows.length > 0) {
        return result.rows[0];
    }

    // Fallback to offer defaults
    const offerResult = await query(
        `SELECT subject, from_name, html_content
         FROM offers WHERE id = $1`,
        [offerId]
    );

    return offerResult.rows[0] || null;
}

/**
 * Pick a random active from_name for an offer
 * @param {number} offerId - Offer ID
 * @returns {Promise<string|null>} - From name or null
 */
async function pickFromName(offerId) {
    const result = await query(
        `SELECT value FROM from_names
         WHERE offer_id = $1 AND status = 'active'
         ORDER BY RANDOM()
         LIMIT 1`,
        [offerId]
    );

    if (result.rows.length > 0) {
        return result.rows[0].value;
    }

    // Fallback to offer default
    const offerResult = await query(
        `SELECT from_name FROM offers WHERE id = $1`,
        [offerId]
    );

    return offerResult.rows[0]?.from_name || null;
}

/**
 * Pick a random active subject for an offer
 * @param {number} offerId - Offer ID
 * @returns {Promise<string|null>} - Subject or null
 */
async function pickSubject(offerId) {
    const result = await query(
        `SELECT value FROM subjects
         WHERE offer_id = $1 AND status = 'active'
         ORDER BY RANDOM()
         LIMIT 1`,
        [offerId]
    );

    if (result.rows.length > 0) {
        return result.rows[0].value;
    }

    // Fallback to offer default
    const offerResult = await query(
        `SELECT subject FROM offers WHERE id = $1`,
        [offerId]
    );

    return offerResult.rows[0]?.subject || null;
}

/**
 * Get offer links (click and unsub URLs)
 * @param {number} offerId - Offer ID
 * @param {number|null} creativeId - Optional creative ID
 * @returns {Promise<Object>} - Object with clickUrl and unsubUrl
 */
async function getOfferLinks(offerId, creativeId = null) {
    const result = await query(
        `SELECT type, value FROM offer_links
         WHERE offer_id = $1 
         AND (creative_id = $2 OR creative_id IS NULL)
         AND status = 'active'
         ORDER BY creative_id DESC NULLS LAST`,
        [offerId, creativeId]
    );

    const links = {
        clickUrl: null,
        unsubUrl: null
    };

    result.rows.forEach(row => {
        if (row.type === 'click' && !links.clickUrl) {
            links.clickUrl = row.value;
        } else if (row.type === 'unsub' && !links.unsubUrl) {
            links.unsubUrl = row.value;
        }
    });

    // Fallback to offer defaults if not found
    if (!links.clickUrl || !links.unsubUrl) {
        const offerResult = await query(
            `SELECT click_url, unsub_url FROM offers WHERE id = $1`,
            [offerId]
        );
        if (offerResult.rows.length > 0) {
            links.clickUrl = links.clickUrl || offerResult.rows[0].click_url;
            links.unsubUrl = links.unsubUrl || offerResult.rows[0].unsub_url;
        }
    }

    return links;
}

/**
 * Replace placeholders in HTML content with recipient data
 * @param {string} htmlContent - HTML template
 * @param {Object} recipientData - Recipient data object
 * @returns {string} - Processed HTML
 */
function replacePlaceholders(htmlContent, recipientData) {
    let html = htmlContent;
    
    // Extract username from email for [to] placeholder
    const toUsername = recipientData.to_email ? recipientData.to_email.split('@')[0] : '';
    
    html = html.replace(/\[to\]/g, toUsername);
    html = html.replace(/\[email\]/g, recipientData.to_email || '');
    html = html.replace(/\[first_name\]/g, recipientData.first_name || toUsername);
    html = html.replace(/\[last_name\]/g, recipientData.last_name || '');
    html = html.replace(/\[geo\]/g, recipientData.geo || '');
    
    return html;
}

module.exports = {
    filterRecipients,
    pickCreative,
    pickFromName,
    pickSubject,
    getOfferLinks,
    replacePlaceholders
};
