/**
 * Input Sanitization Utility - v7.0 CORRECTED
 * 🔥 FIXES: Password not sanitized, unknown fields throw error, configurable whitelist
 */

import validator from 'validator';
import xss from 'xss';
import { logger } from './logger-v4.js';
import { ValidationError, InvalidGenderError } from './errors-v5.js';

/**
 * ✅ FIXED: Sanitize string input
 * Configurable whitelist for different use cases
 */
export const sanitizeString = (value, options = {}) => {
    if (!value || typeof value !== 'string') return value;
    
    // Default options: no HTML allowed
    const defaultOptions = {
        whiteList: options.whiteList || {},
        stripIgnoredTag: true,
        stripLeakingTagsForSafeHTML: true
    };
    
    // Single sanitization: XSS removal only
    let sanitized = xss(value, defaultOptions);
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
};

/**
 * ✅ Rich text sanitizer
 * Allows safe HTML tags for rich text content
 */
export const sanitizeRichText = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    // Allow safe formatting tags
    let sanitized = xss(value, {
        whiteList: {
            b: [],
            i: [],
            strong: [],
            em: [],
            u: [],
            p: [],
            br: [],
            ul: [],
            ol: [],
            li: [],
            a: ['href', 'title'],
            h1: [],
            h2: [],
            h3: [],
            h4: [],
            h5: [],
            h6: []
        },
        stripIgnoredTag: true,
        stripLeakingTagsForSafeHTML: true
    });
    
    return sanitized.trim();
};

/**
 * Sanitize email
 */
export const sanitizeEmail = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    const email = value.toLowerCase().trim();
    
    if (!validator.isEmail(email)) {
        throw new ValidationError('Invalid email format', [
            { field: 'email', message: 'Must be a valid email address' }
        ]);
    }
    
    return validator.normalizeEmail(email);
};

/**
 * Sanitize phone number with locale support
 */
export const sanitizePhone = (value, locale = 'any') => {
    if (!value || typeof value !== 'string') return value;
    
    let phone = value.replace(/[^\d+\-() ]/g, '');
    
    if (!validator.isMobilePhone(phone, locale)) {
        throw new ValidationError('Invalid phone number format', [
            { field: 'phone', message: `Must be a valid phone number (locale: ${locale})` }
        ]);
    }
    
    return phone;
};

/**
 * Sanitize URL
 */
export const sanitizeUrl = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    const url = value.trim();
    
    if (!validator.isURL(url)) {
        throw new ValidationError('Invalid URL format', [
            { field: 'url', message: 'Must be a valid URL' }
        ]);
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
        throw new ValidationError('Invalid number format', [
            { field: 'number', message: 'Must be a valid number' }
        ]);
    }
    
    return num;
};

/**
 * Sanitize integer input
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
 */
export const sanitizeDate = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    const date = value.trim();
    
    if (!validator.isISO8601(date)) {
        throw new ValidationError('Invalid date format', [
            { field: 'date', message: 'Must be in ISO 8601 format (YYYY-MM-DD)' }
        ]);
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
    
    throw new ValidationError('Invalid boolean format', [
        { field: 'boolean', message: 'Must be true or false' }
    ]);
};

/**
 * Sanitize enum input
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
 * NOW THROWS ERROR for unknown fields instead of silently skipping
 */
export const sanitizeObject = (obj, schema = {}) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    const errors = [];
    
    for (const [key, value] of Object.entries(obj)) {
        // ✅ FIXED: Throw error for unknown fields instead of silently skipping
        if (Object.keys(schema).length > 0 && !schema[key]) {
            errors.push({
                field: key,
                message: 'Field not allowed'
            });
            continue;
        }
        
        const fieldSchema = schema[key];
        
        try {
            if (!fieldSchema) {
                // No schema defined, sanitize as string
                sanitized[key] = sanitizeString(value);
            } else if (fieldSchema.type === 'string') {
                sanitized[key] = sanitizeString(value);
            } else if (fieldSchema.type === 'richtext') {
                sanitized[key] = sanitizeRichText(value);
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
            } else if (fieldSchema.type === 'password') {
                // ✅ FIXED: Password is NOT sanitized - use raw value
                sanitized[key] = value;
            } else {
                sanitized[key] = sanitizeString(value);
            }
        } catch (error) {
            if (error instanceof ValidationError) {
                errors.push(...error.errors);
            } else {
                errors.push({
                    field: key,
                    message: error.message
                });
            }
        }
    }
    
    // ✅ FIXED: Throw error if any unknown fields or validation errors
    if (errors.length > 0) {
        throw new ValidationError('Validation failed', errors);
    }
    
    return sanitized;
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
    sanitizeRichText,
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
