/**
 * Input Sanitization Utility - v6.0 CORRECTED
 * 🔥 FIXES: Double escaping removed, locale support added, validateQuerySafety removed
 */

import validator from 'validator';
import xss from 'xss';
import { logger } from './logger-v4.js';
import { ValidationError, InvalidGenderError } from './errors-v5.js';

/**
 * ✅ FIXED: Sanitize string input
 * REMOVED: validator.escape() to prevent double escaping
 * ONLY uses xss() - this is sufficient
 */
export const sanitizeString = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    // Single sanitization: XSS removal only
    let sanitized = xss(value, {
        whiteList: {},
        stripIgnoredTag: true,
        stripLeakingTagsForSafeHTML: true
    });
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
};

/**
 * ✅ FIXED: Sanitize email
 * Throws ValidationError instead of generic Error
 */
export const sanitizeEmail = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    const email = value.toLowerCase().trim();
    
    // Validate email format
    if (!validator.isEmail(email)) {
        throw new ValidationError('Invalid email format', [
            { field: 'email', message: 'Must be a valid email address' }
        ]);
    }
    
    // Normalize email
    return validator.normalizeEmail(email);
};

/**
 * ✅ FIXED: Sanitize phone number
 * Added locale support: 'any' accepts international formats
 * Can be customized per region: 'ar-EG', 'en-US', etc.
 */
export const sanitizePhone = (value, locale = 'any') => {
    if (!value || typeof value !== 'string') return value;
    
    // Remove non-numeric characters except +, -, (), space
    let phone = value.replace(/[^\d+\-() ]/g, '');
    
    // Validate phone format with locale support
    if (!validator.isMobilePhone(phone, locale)) {
        throw new ValidationError('Invalid phone number format', [
            { field: 'phone', message: `Must be a valid phone number (locale: ${locale})` }
        ]);
    }
    
    return phone;
};

/**
 * Sanitize URL
 * Throws ValidationError instead of generic Error
 */
export const sanitizeUrl = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    const url = value.trim();
    
    // Validate URL
    if (!validator.isURL(url)) {
        throw new ValidationError('Invalid URL format', [
            { field: 'url', message: 'Must be a valid URL' }
        ]);
    }
    
    return url;
};

/**
 * Sanitize numeric input
 * Throws ValidationError instead of generic Error
 */
export const sanitizeNumber = (value) => {
    if (value === null || value === undefined) return null;
    
    const num = Number(value);
    
    if (isNaN(num)) {
        throw new ValidationError('Invalid number format', [
            { field: 'number', message: 'Must be a valid number' }
        ]);
    }
    
    return num;
};

/**
 * Sanitize integer input
 * Throws ValidationError instead of generic Error
 */
export const sanitizeInteger = (value) => {
    const num = sanitizeNumber(value);
    
    if (!Number.isInteger(num)) {
        throw new ValidationError('Invalid integer format', [
            { field: 'integer', message: 'Must be a valid integer' }
        ]);
    }
    
    return num;
};

/**
 * Sanitize date input
 * Throws ValidationError instead of generic Error
 */
export const sanitizeDate = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    const date = value.trim();
    
    // Validate ISO 8601 format
    if (!validator.isISO8601(date)) {
        throw new ValidationError('Invalid date format', [
            { field: 'date', message: 'Must be in ISO 8601 format (YYYY-MM-DD)' }
        ]);
    }
    
    return date;
};

/**
 * Sanitize boolean input
 * Throws ValidationError instead of generic Error
 */
export const sanitizeBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    
    if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (lower === 'true' || lower === '1' || lower === 'yes') return true;
        if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }
    
    throw new ValidationError('Invalid boolean format', [
        { field: 'boolean', message: 'Must be true or false' }
    ]);
};

/**
 * Sanitize enum input
 * Throws ValidationError instead of generic Error
 */
export const sanitizeEnum = (value, allowedValues) => {
    if (!value || typeof value !== 'string') return value;
    
    const sanitized = value.toLowerCase().trim();
    
    if (!allowedValues.includes(sanitized)) {
        throw new ValidationError('Invalid enum value', [
            { field: 'enum', message: `Must be one of: ${allowedValues.join(', ')}` }
        ]);
    }
    
    return sanitized;
};

/**
 * Sanitize array of strings
 */
export const sanitizeStringArray = (values) => {
    if (!Array.isArray(values)) {
        throw new ValidationError('Invalid array format', [
            { field: 'array', message: 'Expected an array' }
        ]);
    }
    
    return values.map(v => sanitizeString(v));
};

/**
 * ✅ FIXED: Sanitize object (recursively)
 * Now only used within DTO layer - no middleware duplication
 * This is the SINGLE SOURCE OF TRUTH for sanitization
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
        
        try {
            if (!fieldSchema) {
                // No schema defined, sanitize as string
                sanitized[key] = sanitizeString(value);
            } else if (fieldSchema.type === 'string') {
                sanitized[key] = sanitizeString(value);
            } else if (fieldSchema.type === 'email') {
                sanitized[key] = sanitizeEmail(value);
            } else if (fieldSchema.type === 'phone') {
                sanitized[key] = sanitizePhone(value, fieldSchema.locale || 'any');
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
        } catch (error) {
            // Re-throw ValidationError as-is
            if (error instanceof ValidationError) {
                throw error;
            }
            // Convert other errors to ValidationError
            throw new ValidationError(`Validation failed for field: ${key}`, [
                { field: key, message: error.message }
            ]);
        }
    }
    
    return sanitized;
};

/**
 * ❌ REMOVED: validateQuerySafety()
 * 
 * REASON: This function provides false sense of security
 * 
 * The REAL protection against SQL injection is:
 * ✅ Parameterized queries with placeholders (?)
 * ✅ connection.execute('SELECT * FROM users WHERE email = ?', [email])
 * 
 * The attacker doesn't attack the query string itself;
 * they attack the INPUT VALUES.
 * 
 * Parameterized queries handle this correctly.
 * This function is unnecessary and misleading.
 */

/**
 * Sanitize request body with schema
 * This is the ONLY place where sanitization happens
 * DTOs call this function
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
    sanitizeRequestBody
};
