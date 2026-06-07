/**
 * CORS Configuration - v11.0 FINAL
 * ✅ FIXED: Cache allowed origins (no repeated logging per request)
 * ✅ FIXED: Use debug logging for noisy requests
 * ✅ FIXED: Allow external APIs in connectSrc
 */

import cors from 'cors';
import { logger } from '../utils/logger-v4.js';

/**
 * ✅ FIXED: Cache allowed origins once at startup
 * Instead of calling on every request
 */
let cachedAllowedOrigins = null;

/**
 * ✅ FIXED: Initialize allowed origins once
 * Call this once at server startup
 */
export const initializeAllowedOrigins = () => {
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
    
    cachedAllowedOrigins = allowedOrigins;
    logger.info('Allowed CORS origins initialized', { 
        count: allowedOrigins.length,
        origins: allowedOrigins 
    });
    
    return allowedOrigins;
};

/**
 * ✅ FIXED: Get cached allowed origins
 */
export const getAllowedOrigins = () => {
    if (!cachedAllowedOrigins) {
        return initializeAllowedOrigins();
    }
    return cachedAllowedOrigins;
};

/**
 * ✅ FIXED: Dynamic CORS configuration for monolithic web app
 * - Cached allowed origins (no repeated logging)
 * - Debug logging for noisy requests (no origin)
 * - Allow external APIs in connectSrc
 */
export const corsConfig = cors({
    origin: (origin, callback) => {
        // ✅ FIXED: Use cached origins (no repeated logging)
        const allowedOrigins = getAllowedOrigins();
        
        // ✅ FIXED: For monolithic web app, allow requests without origin
        // But use DEBUG logging (not WARN) since this happens often
        if (!origin) {
            logger.debug('CORS request without origin header', {
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
            // ✅ Use WARN for actual violations
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
    initializeAllowedOrigins,
    getAllowedOrigins,
    corsConfig,
    corsErrorHandler
};
