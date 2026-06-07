import { body, param, query, validationResult } from 'express-validator';

// ============ VALIDATION ERROR HANDLER ============

export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.param,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

// ============ LOGIN VALIDATION ============

export const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    handleValidationErrors
];

// ============ REGISTER VALIDATION ============

export const validateRegister = [
    body('name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters'),
    body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and numbers'),
    body('role')
        .optional()
        .isIn(['admin', 'staff', 'doctor', 'user'])
        .withMessage('Invalid role'),
    handleValidationErrors
];

// ============ PATIENT VALIDATION ============

export const validatePatient = [
    body('first_name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('First name must be at least 2 characters'),
    body('last_name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Last name must be at least 2 characters'),
    body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Invalid phone number'),
    body('date_of_birth')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
    body('gender')
        .optional()
        .isIn(['M', 'F', 'Other'])
        .withMessage('Invalid gender'),
    handleValidationErrors
];

// ============ DOCTOR VALIDATION ============

export const validateDoctor = [
    body('name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters'),
    body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    body('phone')
        .isMobilePhone()
        .withMessage('Invalid phone number'),
    body('specialization')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Specialization required'),
    body('license_number')
        .trim()
        .isLength({ min: 3 })
        .withMessage('License number required'),
    handleValidationErrors
];

// ============ APPOINTMENT VALIDATION ============

export const validateAppointment = [
    param('patientId')
        .isInt()
        .withMessage('Invalid patient ID'),
    body('doctor_id')
        .isInt()
        .withMessage('Invalid doctor ID'),
    body('appointment_date')
        .isISO8601()
        .withMessage('Invalid date format'),
    body('appointment_time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid time format (HH:MM)'),
    body('reason')
        .trim()
        .isLength({ min: 5 })
        .withMessage('Reason must be at least 5 characters'),
    handleValidationErrors
];

// ============ SEARCH VALIDATION ============

export const validateSearch = [
    query('q')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Search query must be at least 2 characters'),
    handleValidationErrors
];

export default {
    handleValidationErrors,
    validateLogin,
    validateRegister,
    validatePatient,
    validateDoctor,
    validateAppointment,
    validateSearch
};
