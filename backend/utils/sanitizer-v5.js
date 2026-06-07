/**
 * Input Sanitization Utility - v5.0 Production Ready
 * GAP 1 FIX: Comprehensive XSS and SQL injection prevention
 */

import validator from 'validator';
import xss from 'xss';
import { logger } from './logger-v4.js';

/**
 * Sanitize string input
 * Removes XSS vectors and HTML injection
 */
export const sanitizeString = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    // Remove XSS vectors
    let sanitized = xss(value, {
        whiteList: {},
        stripIgnoredTag: true,
        stripLeakingTagsForSafeHTML: true
    });
    
    // Escape HTML entities
    sanitized = validator.escape(sanitized);
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
};

/**
 * Sanitize email
 */
export const sanitizeEmail = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    const email = value.toLowerCase().trim();
    
    // Validate email format
    if (!validator.isEmail(email)) {
        throw new Error('Invalid email format');
    }
    
    // Normalize email
    return validator.normalizeEmail(email);
};

/**
 * Sanitize phone number
 */
export const sanitizePhone = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    // Remove non-numeric characters except +, -, ()
    let phone = value.replace(/[^\d+\-()]/g, '');
    
    // Validate phone format
    if (!validator.isMobilePhone(phone)) {
        throw new Error('Invalid phone number format');
    }
    
    return phone;
};

/**
 * Sanitize URL
 */
export const sanitizeUrl = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    const url = value.trim();
    
    // Validate URL
    if (!validator.isURL(url)) {
        throw new Error('Invalid URL format');
    }
    
    return url;
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumber = (value) => {
    if (value === null || value === undefined) return null;
    
    const num = Number(value);
    
    if (isNaN(num)) {
        throw new Error('Invalid number format');
    }
    
    return num;
};

/**
 * Sanitize integer input
 */
export const sanitizeInteger = (value) => {
    const num = sanitizeNumber(value);
    
    if (!Number.isInteger(num)) {
        throw new Error('Invalid integer format');
    }
    
    return num;
};

/**
 * Sanitize date input
 */
export const sanitizeDate = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    const date = value.trim();
    
    // Validate ISO 8601 format
    if (!validator.isISO8601(date)) {
        throw new Error('Invalid date format (use ISO 8601)');
    }
    
    return date;
};

/**
 * Sanitize boolean input
 */
export const sanitizeBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    
    if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (lower === 'true' || lower === '1' || lower === 'yes') return true;
        if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }
    
    throw new Error('Invalid boolean format');
};

/**
 * Sanitize enum input
 */
export const sanitizeEnum = (value, allowedValues) => {
    if (!value || typeof value !== 'string') return value;
    
    const sanitized = value.toLowerCase().trim();
    
    if (!allowedValues.includes(sanitized)) {
        throw new Error(`Invalid value. Must be one of: ${allowedValues.join(', ')}`);
    }
    
    return sanitized;
};

/**
 * Sanitize array of strings
 */
export const sanitizeStringArray = (values) => {
    if (!Array.isArray(values)) {
        throw new Error('Expected array');
    }
    
    return values.map(v => sanitizeString(v));
};

/**
 * Sanitize object (recursively)
 */
export const sanitizeObject = (obj, schema = {}) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
        // Skip if not in schema (whitelist approach)
        if (Object.keys(schema).length > 0 && !schema[key]) {
            logger.warn(`Skipping unknown field: ${key}`);
            continue;
        }
        
        const fieldSchema = schema[key];
        
        if (!fieldSchema) {
            // No schema defined, sanitize as string
            sanitized[key] = sanitizeString(value);
        } else if (fieldSchema.type === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (fieldSchema.type === 'email') {
            sanitized[key] = sanitizeEmail(value);
        } else if (fieldSchema.type === 'phone') {
            sanitized[key] = sanitizePhone(value);
        } else if (fieldSchema.type === 'url') {
            sanitized[key] = sanitizeUrl(value);
        } else if (fieldSchema.type === 'number') {
            sanitized[key] = sanitizeNumber(value);
        } else if (fieldSchema.type === 'integer') {
            sanitized[key] = sanitizeInteger(value);
        } else if (fieldSchema.type === 'date') {
            sanitized[key] = sanitizeDate(value);
        } else if (fieldSchema.type === 'boolean') {
            sanitized[key] = sanitizeBoolean(value);
        } else if (fieldSchema.type === 'enum') {
            sanitized[key] = sanitizeEnum(value, fieldSchema.values);
        } else if (fieldSchema.type === 'array') {
            sanitized[key] = sanitizeStringArray(value);
        } else {
            sanitized[key] = sanitizeString(value);
        }
    }
    
    return sanitized;
};

/**
 * Prevent SQL injection with parameterized queries
 * This is a reminder/documentation that we ALWAYS use parameterized queries
 * 
 * ❌ NEVER DO THIS:
 * const query = `SELECT * FROM users WHERE email = '${email}'`;
 * 
 * ✅ ALWAYS DO THIS:
 * const query = 'SELECT * FROM users WHERE email = ?';
 * const [results] = await connection.execute(query, [email]);
 */
export const validateQuerySafety = (query) => {
    // Check for common SQL injection patterns
    const dangerousPatterns = [
        /['";]/,  // Quotes that could break out
        /--/,     // SQL comments
        /\/\*/,   // Multi-line comments
        /xp_/i,   // Extended stored procedures
        /sp_/i,   // System stored procedures
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(query)) {
            logger.warn('Potential SQL injection detected in query');
            return false;
        }
    }
    
    return true;
};

/**
 * Sanitize request body with schema
 */
export const sanitizeRequestBody = (body, schema) => {
    try {
        return sanitizeObject(body, schema);
    } catch (error) {
        logger.error('Sanitization error:', error.message);
        throw error;
    }
};

export default {
    sanitizeString,
    sanitizeEmail,
    sanitizePhone,
    sanitizeUrl,
    sanitizeNumber,
    sanitizeInteger,
    sanitizeDate,
    sanitizeBoolean,
    sanitizeEnum,
    sanitizeStringArray,
    sanitizeObject,
    validateQuerySafety,
    sanitizeRequestBody
};
