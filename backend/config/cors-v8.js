/**
 * CORS Configuration - v8.0
 * ✅ FIXED: Dynamic CORS validation, proper origin checking
 */

import cors from 'cors';
import { logger } from '../utils/logger-v4.js';

/**
 * ✅ FIXED: Allowed origins configuration
 * Centralized list of allowed origins
 */
const getAllowedOrigins = () => {
    const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000'
    ];
    
    // Add production origins from environment
    if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (process.env.ALLOWED_ORIGINS) {
        const envOrigins = process.env.ALLOWED_ORIGINS.split(',');
        allowedOrigins.push(...envOrigins.map(o => o.trim()));
    }
    
    return allowedOrigins;
};

/**
 * ✅ FIXED: Dynamic CORS configuration
 * Validates origin on each request
 */
export const corsConfig = cors({
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        
        // Allow requests with no origin (mobile apps, curl requests)
        if (!origin) {
            return callback(null, true);
        }
        
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
    if (err.message === 'Not allowed by CORS') {
        logger.error('CORS error', { origin: req.get('origin'), path: req.path });
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
