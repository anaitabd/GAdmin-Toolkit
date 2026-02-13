/**
 * Validation utilities for GAdmin-Toolkit
 * Provides reusable validation functions for email, domain, and other inputs
 */

// RFC 5322 compliant email validation pattern
// Allows: alphanumerics, dots, special chars (!#$%&'*+/=?^_`{|}~-) in local part
// Requires: @ symbol, valid domain with alphanumerics and hyphens
// Prevents: consecutive dots, dots at start/end, invalid special characters
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email is valid
 */
const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    
    const trimmedEmail = email.trim();
    
    // Additional checks for edge cases
    if (trimmedEmail.includes('..')) return false; // No consecutive dots
    if (trimmedEmail.includes('@@')) return false; // No consecutive @ signs
    if (trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) return false; // No dots at start/end
    
    return EMAIL_REGEX.test(trimmedEmail);
};

/**
 * Validate domain name format
 * @param {string} domain - Domain name to validate
 * @returns {boolean} - True if domain is valid
 */
const isValidDomain = (domain) => {
    if (!domain || typeof domain !== 'string') return false;
    
    // More robust domain validation:
    // - Must start and end with alphanumeric
    // - Can contain hyphens but not consecutively or at start/end
    // - Must have at least one dot
    // - TLD must be at least 2 characters
    // - No consecutive dots
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    
    // Additional check: no consecutive dots
    if (domain.includes('..')) return false;
    
    return domainRegex.test(domain.trim());
};

/**
 * Validate password strength
 * Note: This only checks minimum length. For production use with Google Workspace,
 * consider adding complexity requirements based on your organization's policies:
 * - Uppercase letters
 * - Lowercase letters  
 * - Numbers
 * - Special characters
 * 
 * @param {string} password - Password to validate
 * @param {number} minLength - Minimum length required (default: 8)
 * @returns {object} - { valid: boolean, message: string }
 */
const validatePassword = (password, minLength = 8) => {
    if (!password || typeof password !== 'string') {
        return { valid: false, message: 'Password is required' };
    }
    
    if (password.length < minLength) {
        return { 
            valid: false, 
            message: `Password must be at least ${minLength} characters` 
        };
    }
    
    // Note: Add complexity checks here if needed for your organization
    // Example: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    
    return { valid: true, message: 'Password is valid' };
};

/**
 * Validate Google API credentials object
 * @param {object} creds - Credentials object to validate
 * @returns {boolean} - True if credentials are valid
 */
const isValidGoogleCreds = (creds) => {
    if (!creds || typeof creds !== 'object') return false;
    return Boolean(creds.client_email && creds.private_key);
};

module.exports = {
    isValidEmail,
    isValidDomain,
    validatePassword,
    isValidGoogleCreds
};
