/**
 * Validation Middleware - v4.0 Production Ready
 * GAP 4 FIX: XSS protection and input sanitization
 */

import { body, param, query, validationResult } from 'express-validator';
import xss from 'xss';

/**
 * Sanitize string input (XSS protection)
 * GAP 4 FIX: Remove potentially dangerous HTML/JavaScript
 */
const sanitizeString = (value) => {
    if (!value || typeof value !== 'string') return value;
    return xss(value, {
        whiteList: {},
        stripIgnoredTag: true,
        stripLeakingTagsForSafeHTML: true
    });
};

/**
 * Sanitize email
 */
const sanitizeEmail = (value) => {
    if (!value) return value;
    return value.toLowerCase().trim();
};

/**
 * Strong password validation
 * 8+ chars, uppercase, lowercase, numbers
 */
export const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail()
        .customSanitizer({ options: (value) => sanitizeEmail(value) }),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
];

export const validateRegister = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Name must be 2-255 characters')
        .customSanitizer({ options: (value) => sanitizeString(value) }),
    body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail()
        .customSanitizer({ options: (value) => sanitizeEmail(value) }),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and numbers'),
    body('role')
        .optional()
        .isIn(['admin', 'staff', 'doctor', 'user'])
        .withMessage('Invalid role')
];

/**
 * Patient validation
 * GAP 3 FIX: Correct gender enum
 */
export const validatePatient = [
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name required')
        .customSanitizer({ options: (value) => sanitizeString(value) }),
    body('lastName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name required')
        .customSanitizer({ options: (value) => sanitizeString(value) }),
    body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail()
        .customSanitizer({ options: (value) => sanitizeEmail(value) }),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Invalid phone number'),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
    body('gender')
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be male, female, or other'),
    body('address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address too long')
        .customSanitizer({ options: (value) => sanitizeString(value) }),
    body('emergencyContact')
        .optional()
        .trim()
        .customSanitizer({ options: (value) => sanitizeString(value) }),
    body('bloodType')
        .optional()
        .isIn(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
        .withMessage('Invalid blood type'),
    body('allergies')
        .optional()
        .trim()
        .customSanitizer({ options: (value) => sanitizeString(value) })
];

/**
 * Doctor validation
 */
export const validateDoctor = [
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name required')
        .customSanitizer({ options: (value) => sanitizeString(value) }),
    body('lastName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name required')
        .customSanitizer({ options: (value) => sanitizeString(value) }),
    body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail()
        .customSanitizer({ options: (value) => sanitizeEmail(value) }),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Invalid phone number'),
    body('specialization')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Specialization required')
        .customSanitizer({ options: (value) => sanitizeString(value) }),
    body('licenseNumber')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('License number required')
        .customSanitizer({ options: (value) => sanitizeString(value) })
];

/**
 * Appointment validation
 */
export const validateAppointment = [
    body('patientId')
        .isInt({ min: 1 })
        .withMessage('Valid patient ID required'),
    body('doctorId')
        .isInt({ min: 1 })
        .withMessage('Valid doctor ID required'),
    body('appointmentDate')
        .isISO8601()
        .withMessage('Invalid date format'),
    body('appointmentTime')
        .matches(/^\d{2}:\d{2}$/)
        .withMessage('Invalid time format (HH:MM)'),
    body('reason')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Reason required')
        .customSanitizer({ options: (value) => sanitizeString(value) })
];

/**
 * Medical record validation
 */
export const validateMedicalRecord = [
    body('patientId')
        .isInt({ min: 1 })
        .withMessage('Valid patient ID required'),
    body('visitDate')
        .isISO8601()
        .withMessage('Invalid date format'),
    body('diagnosis')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Diagnosis required')
        .customSanitizer({ options: (value) => sanitizeString(value) }),
    body('treatment')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Treatment required')
        .customSanitizer({ options: (value) => sanitizeString(value) }),
    body('prescriptions')
        .optional()
        .trim()
        .customSanitizer({ options: (value) => sanitizeString(value) })
];

/**
 * Invoice validation
 */
export const validateInvoice = [
    body('patientId')
        .isInt({ min: 1 })
        .withMessage('Valid patient ID required'),
    body('amount')
        .isDecimal({ min: '0.01', max: '999999.99' })
        .withMessage('Invalid amount'),
    body('description')
        .optional()
        .trim()
        .customSanitizer({ options: (value) => sanitizeString(value) }),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format')
];

/**
 * Pagination validation
 */
export const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be >= 1'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be 1-100')
];

/**
 * Search validation
 */
export const validateSearch = [
    query('q')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query required')
        .customSanitizer({ options: (value) => sanitizeString(value) })
];

/**
 * Numeric ID validation
 */
export const validateNumericId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid ID')
];

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

export default {
    validateLogin,
    validateRegister,
    validatePatient,
    validateDoctor,
    validateAppointment,
    validateMedicalRecord,
    validateInvoice,
    validatePagination,
    validateSearch,
    validateNumericId,
    handleValidationErrors
};
