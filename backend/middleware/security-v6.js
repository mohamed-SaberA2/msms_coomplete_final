/**
 * Advanced Security Middleware - v6.0
 * 🔥 FIXES: CSRF tokens, custom Helmet config, per-user rate limiting, account lock
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { logger } from '../utils/logger-v4.js';
import { RateLimitError, AuthenticationError } from '../utils/errors-v5.js';

/**
 * ✅ CSRF Token Generation
 * Generates cryptographically secure CSRF tokens
 */
export const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * ✅ CSRF Token Middleware
 * Validates CSRF tokens on state-changing requests
 */
export const csrfProtection = (req, res, next) => {
    // GET requests don't need CSRF protection
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    
    // Generate token for response
    const csrfToken = generateCSRFToken();
    res.locals.csrfToken = csrfToken;
    
    // Store in session for validation
    if (!req.session) {
        req.session = {};
    }
    req.session.csrfToken = csrfToken;
    
    // Validate token on POST/PUT/DELETE
    const tokenFromRequest = req.headers['x-csrf-token'] || req.body.csrfToken;
    
    if (!tokenFromRequest) {
        logger.warn('CSRF token missing', { method: req.method, path: req.path });
        return res.status(403).json({
            error: 'CSRF token missing',
            code: 'CSRF_TOKEN_MISSING'
        });
    }
    
    if (tokenFromRequest !== csrfToken) {
        logger.warn('CSRF token invalid', { method: req.method, path: req.path });
        return res.status(403).json({
            error: 'CSRF token invalid',
            code: 'CSRF_TOKEN_INVALID'
        });
    }
    
    next();
};

/**
 * ✅ Custom Helmet Configuration
 * Comprehensive security headers
 */
export const helmetConfig = helmet({
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    
    // X-Frame-Options: Prevent clickjacking
    frameguard: {
        action: 'deny'
    },
    
    // X-Content-Type-Options: Prevent MIME sniffing
    noSniff: true,
    
    // X-XSS-Protection: Enable XSS filter
    xssFilter: true,
    
    // Strict-Transport-Security: Force HTTPS
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    
    // Referrer-Policy: Limit referrer information
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    },
    
    // Permissions-Policy: Restrict browser features
    permittedCrossDomainPolicies: false
});

/**
 * ✅ Per-IP Rate Limiter
 * Limits requests per IP address
 */
export const ipRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
    },
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
        throw new RateLimitError('Too many requests from this IP');
    }
});

/**
 * ✅ Per-User Rate Limiter
 * Limits requests per authenticated user
 */
export const userRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per user per window
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise use IP
        return req.user?.id ? `user_${req.user.id}` : req.ip;
    },
    message: 'Too many requests from this user, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('User rate limit exceeded', { userId: req.user?.id, path: req.path });
        throw new RateLimitError('Too many requests');
    }
});

/**
 * ✅ Login Attempt Rate Limiter
 * Strict rate limiting for login endpoint
 * Prevents brute force attacks
 */
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    keyGenerator: (req) => {
        // Use email if provided, otherwise use IP
        return req.body?.email ? `login_${req.body.email}` : `login_${req.ip}`;
    },
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Login rate limit exceeded', { email: req.body?.email, ip: req.ip });
        throw new RateLimitError('Too many login attempts. Please try again later.');
    }
});

/**
 * ✅ Account Lock System
 * Locks account after failed login attempts
 * Stores in memory (use Redis for production)
 */
class AccountLockManager {
    constructor() {
        this.failedAttempts = new Map(); // email -> { count, lockedUntil }
        this.MAX_ATTEMPTS = 5;
        this.LOCK_DURATION = 15 * 60 * 1000; // 15 minutes
    }
    
    /**
     * Record failed login attempt
     */
    recordFailedAttempt(email) {
        const current = this.failedAttempts.get(email) || { count: 0, lockedUntil: null };
        
        current.count += 1;
        
        if (current.count >= this.MAX_ATTEMPTS) {
            current.lockedUntil = Date.now() + this.LOCK_DURATION;
            logger.warn('Account locked due to failed login attempts', { email });
        }
        
        this.failedAttempts.set(email, current);
    }
    
    /**
     * Check if account is locked
     */
    isLocked(email) {
        const current = this.failedAttempts.get(email);
        
        if (!current || !current.lockedUntil) {
            return false;
        }
        
        // Check if lock has expired
        if (Date.now() > current.lockedUntil) {
            this.failedAttempts.delete(email);
            return false;
        }
        
        return true;
    }
    
    /**
     * Get remaining lock time in seconds
     */
    getRemainingLockTime(email) {
        const current = this.failedAttempts.get(email);
        
        if (!current || !current.lockedUntil) {
            return 0;
        }
        
        const remaining = current.lockedUntil - Date.now();
        return Math.ceil(remaining / 1000);
    }
    
    /**
     * Reset failed attempts after successful login
     */
    resetAttempts(email) {
        this.failedAttempts.delete(email);
    }
}

export const accountLockManager = new AccountLockManager();

/**
 * ✅ Account Lock Middleware
 * Checks if account is locked before allowing login
 */
export const accountLockMiddleware = (req, res, next) => {
    const email = req.body?.email;
    
    if (!email) {
        return next();
    }
    
    if (accountLockManager.isLocked(email)) {
        const remainingTime = accountLockManager.getRemainingLockTime(email);
        logger.warn('Login attempt on locked account', { email, remainingTime });
        
        return res.status(429).json({
            error: `Account locked. Try again in ${remainingTime} seconds`,
            code: 'ACCOUNT_LOCKED',
            remainingTime
        });
    }
    
    next();
};

/**
 * ✅ Security Headers Middleware
 * Applies all security configurations
 */
export const securityMiddleware = [
    helmetConfig,
    ipRateLimiter,
    csrfProtection
];

export default {
    generateCSRFToken,
    csrfProtection,
    helmetConfig,
    ipRateLimiter,
    userRateLimiter,
    loginRateLimiter,
    accountLockManager,
    accountLockMiddleware,
    securityMiddleware
};
