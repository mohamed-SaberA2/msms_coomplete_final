/**
 * Rate Limiter Middleware - v4.0 Production Ready
 */

import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development'
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true,
    skip: (req) => process.env.NODE_ENV === 'development'
});

/**
 * Moderate rate limiter for data creation
 */
export const createLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per minute
    message: 'Too many requests, please try again later.',
    skip: (req) => process.env.NODE_ENV === 'development'
});

/**
 * File upload rate limiter
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 uploads per minute
    message: 'Too many file uploads, please try again later.',
    skip: (req) => process.env.NODE_ENV === 'development'
});

export default {
    apiLimiter,
    authLimiter,
    createLimiter,
    uploadLimiter
};
