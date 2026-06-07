/**
 * Logger Utility - v4.0 Production Ready
 * GAP 5 FIX: Masks sensitive data (emails, tokens, etc.)
 */

import winston from 'winston';
import crypto from 'crypto';

/**
 * Mask email address
 * admin@hospital.com → ad***@hospital.com
 */
export const maskEmail = (email) => {
    if (!email || typeof email !== 'string') return '***';
    const [name, domain] = email.split('@');
    if (!domain) return '***';
    const masked = name.substring(0, 2) + '*'.repeat(Math.max(0, name.length - 2)) + '@' + domain;
    return masked;
};

/**
 * Mask token
 * eyJhbGc...NjQ2 → eyJhb...2NjQ2
 */
export const maskToken = (token) => {
    if (!token || token.length < 10) return '***';
    return token.substring(0, 5) + '...' + token.substring(token.length - 5);
};

/**
 * Mask phone number
 * 555-1234 → 555-****
 */
export const maskPhone = (phone) => {
    if (!phone || typeof phone !== 'string') return '***';
    if (phone.length < 4) return '***';
    return phone.substring(0, phone.length - 4) + '****';
};

/**
 * Mask credit card
 * 4532-1234-5678-9010 → 4532-****-****-9010
 */
export const maskCreditCard = (card) => {
    if (!card || typeof card !== 'string') return '***';
    if (card.length < 8) return '***';
    const lastFour = card.substring(card.length - 4);
    return '****-****-****-' + lastFour;
};

/**
 * Mask user ID (hash for privacy)
 */
export const maskUserId = (userId) => {
    if (!userId) return '***';
    const hash = crypto.createHash('sha256').update(String(userId)).digest('hex').substring(0, 8);
    return `user_${hash}`;
};

/**
 * Create Winston logger with sensitive data masking
 */
const createLogger = () => {
    const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
        // Mask sensitive data in message
        let maskedMessage = message;
        
        // Mask emails
        maskedMessage = maskedMessage.replace(
            /[\w\.-]+@[\w\.-]+\.\w+/g,
            (match) => maskEmail(match)
        );
        
        // Mask tokens (pattern: eyJ...)
        maskedMessage = maskedMessage.replace(
            /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
            (match) => maskToken(match)
        );
        
        // Mask phone numbers (pattern: 555-1234)
        maskedMessage = maskedMessage.replace(
            /\d{3}-\d{4}/g,
            (match) => maskPhone(match)
        );
        
        return `[${timestamp}] ${level.toUpperCase()}: ${maskedMessage}`;
    });

    return winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            customFormat
        ),
        defaultMeta: { service: 'hospital-management-api' },
        transports: [
            // Error log file
            new winston.transports.File({
                filename: '.logs/error.log',
                level: 'error',
                maxsize: 5242880, // 5MB
                maxFiles: 5
            }),
            // Combined log file
            new winston.transports.File({
                filename: '.logs/combined.log',
                maxsize: 5242880, // 5MB
                maxFiles: 5
            }),
            // Console output
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    customFormat
                )
            })
        ]
    });
};

export const logger = createLogger();

/**
 * Log user action with masking
 */
export const logUserAction = (userId, action, details = {}) => {
    const maskedDetails = {
        ...details,
        email: details.email ? maskEmail(details.email) : undefined,
        token: details.token ? maskToken(details.token) : undefined,
        phone: details.phone ? maskPhone(details.phone) : undefined
    };
    
    logger.info(`User #${maskUserId(userId)} performed ${action}`, maskedDetails);
};

/**
 * Log authentication event
 */
export const logAuthEvent = (email, action, success = true) => {
    const status = success ? 'SUCCESS' : 'FAILED';
    logger.info(`[AUTH] ${action} - ${status}: ${maskEmail(email)}`);
};

/**
 * Log database operation
 */
export const logDatabaseOperation = (operation, table, count = 0) => {
    logger.debug(`[DB] ${operation} on ${table}: ${count} rows affected`);
};

/**
 * Log error with masking
 */
export const logError = (error, context = {}) => {
    const maskedContext = {
        ...context,
        email: context.email ? maskEmail(context.email) : undefined,
        token: context.token ? maskToken(context.token) : undefined
    };
    
    logger.error(`${error.message}`, {
        stack: error.stack,
        context: maskedContext
    });
};

export default logger;
