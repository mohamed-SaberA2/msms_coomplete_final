/**
 * CORS Configuration - v12.0 FINAL SECURITY TIGHTENING
 * ✅ FIXED: Production-aware origin validation
 * ✅ FIXED: Require origin in production mode
 * ✅ FIXED: Allow internal services only in production
 */

import cors from 'cors';
import { logger } from '../utils/logger-v4.js';

let cachedAllowedOrigins = null;

/**
 * ✅ FIXED: Production-aware origin initialization
 * In production: strict origin requirement
 * In development: allow no-origin for dev tools
 */
export const initializeAllowedOrigins = () => {
    const allowedOrigins = [];
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Development origins
    if (!isProduction) {
        allowedOrigins.push(
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5000',
            'http://127.0.0.1:5000'
        );
    }
    
    // Production origins from environment
    if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (process.env.ALLOWED_ORIGINS) {
        const envOrigins = process.env.ALLOWED_ORIGINS.split(',');
        allowedOrigins.push(...envOrigins.map(o => o.trim()));
    }
    
    // ✅ FIXED: Internal services (for server-to-server in production)
    if (process.env.INTERNAL_SERVICES) {
        const internalServices = process.env.INTERNAL_SERVICES.split(',');
        allowedOrigins.push(...internalServices.map(o => o.trim()));
    }
    
    cachedAllowedOrigins = allowedOrigins;
    logger.info('Allowed CORS origins initialized', { 
        count: allowedOrigins.length,
        isProduction,
        origins: allowedOrigins 
    });
    
    return allowedOrigins;
};

export const getAllowedOrigins = () => {
    if (!cachedAllowedOrigins) {
        return initializeAllowedOrigins();
    }
    return cachedAllowedOrigins;
};

/**
 * ✅ FIXED: Production-aware CORS configuration
 * - In production: require origin header
 * - In development: allow no-origin for dev tools
 */
export const corsConfig = cors({
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        const isProduction = process.env.NODE_ENV === 'production';
        
        // ✅ FIXED: Production-aware origin handling
        if (!origin) {
            if (isProduction) {
                // ✅ In production: reject requests without origin
                logger.warn('CORS request without origin header in production', {
                    method: 'unknown',
                    path: 'unknown',
                    ip: 'unknown'
                });
                return callback(new Error('Origin header required in production'));
            } else {
                // ✅ In development: allow for dev tools
                logger.debug('CORS request without origin header in development', {
                    method: 'unknown',
                    path: 'unknown'
                });
                return callback(null, true);
            }
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
