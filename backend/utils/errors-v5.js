/**
 * Custom Error Types - v5.0 Production Ready
 * GAP 4 FIX: Centralized error handling with custom error classes
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
    
    toJSON() {
        return {
            error: this.message,
            code: this.code,
            statusCode: this.statusCode,
            timestamp: this.timestamp
        };
    }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
        this.details = details;
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            details: this.details
        };
    }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
        this.name = 'ConflictError';
    }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
        this.name = 'RateLimitError';
    }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', originalError = null) {
        super(message, 500, 'DATABASE_ERROR');
        this.name = 'DatabaseError';
        this.originalError = originalError;
    }
}

/**
 * Transaction Error (500)
 */
export class TransactionError extends AppError {
    constructor(message = 'Transaction failed') {
        super(message, 500, 'TRANSACTION_ERROR');
        this.name = 'TransactionError';
    }
}

/**
 * File Upload Error (400)
 */
export class FileUploadError extends AppError {
    constructor(message = 'File upload failed') {
        super(message, 400, 'FILE_UPLOAD_ERROR');
        this.name = 'FileUploadError';
    }
}

/**
 * Invalid Token Error (401)
 */
export class InvalidTokenError extends AppError {
    constructor(message = 'Invalid or expired token') {
        super(message, 401, 'INVALID_TOKEN');
        this.name = 'InvalidTokenError';
    }
}

/**
 * Token Expired Error (401)
 */
export class TokenExpiredError extends AppError {
    constructor(message = 'Token has expired') {
        super(message, 401, 'TOKEN_EXPIRED');
        this.name = 'TokenExpiredError';
    }
}

/**
 * Weak Password Error (400)
 */
export class WeakPasswordError extends AppError {
    constructor(message = 'Password does not meet security requirements') {
        super(message, 400, 'WEAK_PASSWORD');
        this.name = 'WeakPasswordError';
    }
}

/**
 * Duplicate Email Error (409)
 */
export class DuplicateEmailError extends AppError {
    constructor(email) {
        super(`Email ${email} is already registered`, 409, 'DUPLICATE_EMAIL');
        this.name = 'DuplicateEmailError';
    }
}

/**
 * Invalid Gender Error (400)
 */
export class InvalidGenderError extends AppError {
    constructor() {
        super('Invalid gender. Must be male, female, or other', 400, 'INVALID_GENDER');
        this.name = 'InvalidGenderError';
    }
}

/**
 * User Not Found Error (404)
 */
export class UserNotFoundError extends NotFoundError {
    constructor() {
        super('User');
        this.code = 'USER_NOT_FOUND';
    }
}

/**
 * Patient Not Found Error (404)
 */
export class PatientNotFoundError extends NotFoundError {
    constructor() {
        super('Patient');
        this.code = 'PATIENT_NOT_FOUND';
    }
}

/**
 * File Not Found Error (404)
 */
export class FileNotFoundError extends NotFoundError {
    constructor() {
        super('File');
        this.code = 'FILE_NOT_FOUND';
    }
}

/**
 * Doctor Not Found Error (404)
 */
export class DoctorNotFoundError extends NotFoundError {
    constructor() {
        super('Doctor');
        this.code = 'DOCTOR_NOT_FOUND';
    }
}

/**
 * Appointment Not Found Error (404)
 */
export class AppointmentNotFoundError extends NotFoundError {
    constructor() {
        super('Appointment');
        this.code = 'APPOINTMENT_NOT_FOUND';
    }
}

/**
 * Medical Record Not Found Error (404)
 */
export class MedicalRecordNotFoundError extends NotFoundError {
    constructor() {
        super('Medical Record');
        this.code = 'MEDICAL_RECORD_NOT_FOUND';
    }
}

/**
 * Invoice Not Found Error (404)
 */
export class InvoiceNotFoundError extends NotFoundError {
    constructor() {
        super('Invoice');
        this.code = 'INVOICE_NOT_FOUND';
    }
}

export default {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    DatabaseError,
    TransactionError,
    FileUploadError,
    InvalidTokenError,
    TokenExpiredError,
    WeakPasswordError,
    DuplicateEmailError,
    InvalidGenderError,
    UserNotFoundError,
    PatientNotFoundError,
    FileNotFoundError,
    DoctorNotFoundError,
    AppointmentNotFoundError,
    MedicalRecordNotFoundError,
    InvoiceNotFoundError
};
