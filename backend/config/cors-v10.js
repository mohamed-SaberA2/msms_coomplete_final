/**
 * CORS Configuration - v10.0
 * ✅ FIXED: Monolithic web app approach
 * Allow requests without origin (for development tools, integrations)
 * But still validate against whitelist when origin is present
 */

import cors from 'cors';
import { logger } from '../utils/logger-v4.js';

/**
 * ✅ FIXED: Allowed origins configuration
 * Centralized list of allowed origins
 */
const getAllowedOrigins = () => {
    const allowedOrigins = [];
    
    // Add development origins
    if (process.env.NODE_ENV !== 'production') {
        allowedOrigins.push(
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5000',
            'http://127.0.0.1:5000'
        );
    }
    
    // Add production origins from environment
    if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (process.env.ALLOWED_ORIGINS) {
        const envOrigins = process.env.ALLOWED_ORIGINS.split(',');
        allowedOrigins.push(...envOrigins.map(o => o.trim()));
    }
    
    logger.info('Allowed CORS origins configured', { count: allowedOrigins.length });
    return allowedOrigins;
};

/**
 * ✅ FIXED: Dynamic CORS configuration for monolithic web app
 * Allow requests without origin (for Postman, curl, integrations)
 * But validate against whitelist when origin is present
 */
export const corsConfig = cors({
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        
        // ✅ FIXED: For monolithic web app, allow requests without origin
        // But log them for monitoring
        if (!origin) {
            logger.warn('CORS request without origin header', {
                method: 'unknown',
                path: 'unknown'
            });
            // Allow it - could be Postman, curl, or server-to-server
            return callback(null, true);
        }
        
        // ✅ When origin IS present, validate against whitelist
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn('CORS request from unauthorized origin', { origin });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'X-Requested-With'
    ],
    exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'X-CSRF-Token'
    ],
    maxAge: 86400  // 24 hours
});

/**
 * ✅ FIXED: CORS error handler
 * Handles CORS errors gracefully
 */
export const corsErrorHandler = (err, req, res, next) => {
    if (err.message && err.message.includes('CORS')) {
        logger.error('CORS error', { 
            origin: req.get('origin'), 
            path: req.path,
            error: err.message 
        });
        return res.status(403).json({
            error: 'CORS policy violation',
            code: 'CORS_ERROR'
        });
    }
    next(err);
};

export default {
    corsConfig,
    corsErrorHandler,
    getAllowedOrigins
};
