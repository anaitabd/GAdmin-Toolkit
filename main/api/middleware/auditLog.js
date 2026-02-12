/**
 * Audit Log Middleware
 * Provides functions to log CRUD operations to the audit_logs table
 */
const { query } = require('../db');

/**
 * Log an action to the audit_logs table
 * @param {string} actionBy - User or system performing the action
 * @param {number} recordId - ID of the record being acted upon
 * @param {string} recordName - Human-readable name of the record
 * @param {string} recordType - Type of record (e.g., 'offer', 'campaign', 'data_list')
 * @param {string} actionType - Type of action: 'insert', 'update', 'delete'
 * @param {Object} details - Additional details about the action (stored as JSONB)
 * @returns {Promise<void>}
 */
async function logAudit(actionBy, recordId, recordName, recordType, actionType, details = null) {
    try {
        await query(
            `INSERT INTO audit_logs (action_by, record_id, record_name, record_type, action_type, details)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                actionBy || 'system',
                recordId || null,
                recordName || null,
                recordType,
                actionType,
                details ? JSON.stringify(details) : null
            ]
        );
    } catch (error) {
        // Log error but don't throw - audit logging should not break the main operation
        console.error('Failed to log audit entry:', error);
    }
}

/**
 * Express middleware to extract user info from request for audit logging
 * Can be extended to extract user from JWT/session
 * @param {Object} req - Express request object
 * @returns {string} - User identifier
 */
function getActionBy(req) {
    // Try to get user from various sources
    // This can be extended based on your auth implementation
    return req.user?.email || 
           req.headers['x-user-email'] || 
           req.ip || 
           'anonymous';
}

module.exports = {
    logAudit,
    getActionBy
};
