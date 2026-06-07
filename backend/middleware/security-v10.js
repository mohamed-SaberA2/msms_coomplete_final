/**
 * Advanced Security Middleware - v10.0
 * ✅ FIXED: CSP with CDN domains for monolithic web app
 * 
 * Supports:
 * - Font Awesome (CDN)
 * - Google Fonts
 * - Bootstrap CDN
 * - Other common CDNs
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import crypto from 'crypto';
import redis from 'redis';
import { logger } from '../utils/logger-v4.js';
import { RateLimitError, AuthenticationError } from '../utils/errors-v5.js';

// ✅ Initialize as null, set after Redis connects
let redisClient = null;
let redisConnected = false;
let accountLockManager = null;

export const initializeRedis = async () => {
    try {
        // ✅ Modern Redis client configuration
        redisClient = redis.createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                reconnectStrategy: (retries) => Math.min(retries * 50, 500)
            },
            password: process.env.REDIS_PASSWORD || undefined
        });
        
        redisClient.on('error', (err) => {
            logger.error('Redis connection error:', err.message);
            redisConnected = false;
        });
        
        redisClient.on('connect', () => {
            logger.info('Redis connected successfully');
            redisConnected = true;
        });
        
        // ✅ Properly connect to Redis
        await redisClient.connect();
        redisConnected = true;
        logger.info('Redis initialized and connected');
        
        return redisClient;
    } catch (err) {
        logger.warn('Redis initialization failed, using memory fallback', { error: err.message });
        redisClient = null;
        redisConnected = false;
        return null;
    }
};

/**
 * ✅ FIXED: Initialize Account Lock Manager AFTER Redis is ready
 */
export const initAccountLockManager = () => {
    accountLockManager = new AccountLockManager(redisClient);
    logger.info('Account lock manager initialized', { redisConnected });
    return accountLockManager;
};

export const getAccountLockManager = () => {
    if (!accountLockManager) {
        throw new Error('Account lock manager not initialized. Call initAccountLockManager() first.');
    }
    return accountLockManager;
};

/**
 * ✅ FIXED: CSRF Token Generation
 */
export const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * ✅ FIXED: CSRF Token Middleware with Timing-Safe Comparison
 */
export const csrfProtection = (req, res, next) => {
    // GET requests don't need CSRF protection
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        if (!req.session) {
            req.session = {};
        }
        
        if (!req.session.csrfToken) {
            req.session.csrfToken = generateCSRFToken();
        }
        
        res.locals.csrfToken = req.session.csrfToken;
        return next();
    }
    
    // Validate token on POST/PUT/DELETE
    const tokenFromRequest = req.headers['x-csrf-token'] || req.body?.csrfToken;
    
    if (!req.session) {
        req.session = {};
    }
    
    const storedToken = req.session.csrfToken;
    
    if (!storedToken) {
        logger.warn('CSRF token missing from session', { method: req.method, path: req.path });
        return res.status(403).json({
            error: 'CSRF token missing from session',
            code: 'CSRF_TOKEN_MISSING'
        });
    }
    
    if (!tokenFromRequest) {
        logger.warn('CSRF token missing from request', { method: req.method, path: req.path });
        return res.status(403).json({
            error: 'CSRF token missing from request',
            code: 'CSRF_TOKEN_MISSING'
        });
    }
    
    // ✅ Check length first before timing-safe comparison
    if (tokenFromRequest.length !== storedToken.length) {
        logger.warn('CSRF token length mismatch', { method: req.method, path: req.path });
        return res.status(403).json({
            error: 'CSRF token invalid',
            code: 'CSRF_TOKEN_INVALID'
        });
    }
    
    // ✅ Use timing-safe comparison
    try {
        const isValid = crypto.timingSafeEqual(
            Buffer.from(tokenFromRequest),
            Buffer.from(storedToken)
        );
        
        if (!isValid) {
            logger.warn('CSRF token invalid', { method: req.method, path: req.path });
            return res.status(403).json({
                error: 'CSRF token invalid',
                code: 'CSRF_TOKEN_INVALID'
            });
        }
    } catch (err) {
        logger.warn('CSRF token comparison failed', { method: req.method, path: req.path });
        return res.status(403).json({
            error: 'CSRF token invalid',
            code: 'CSRF_TOKEN_INVALID'
        });
    }
    
    // Generate new token for next request
    req.session.csrfToken = generateCSRFToken();
    res.locals.csrfToken = req.session.csrfToken;
    
    next();
};

/**
 * ✅ FIXED: Custom Helmet Configuration with CDN Support
 * Allows common CDNs while keeping strict CSP
 */
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            
            // ✅ FIXED: Add CDN domains for scripts
            scriptSrc: [
                "'self'",
                "https://cdnjs.cloudflare.com",  // Font Awesome, Bootstrap
                "https://cdn.jsdelivr.net",      // Alternative CDN
                "https://unpkg.com"              // npm packages
            ],
            
            // ✅ FIXED: Add CDN domains for styles
            styleSrc: [
                "'self'",
                "'unsafe-inline'",  // For inline styles (if needed)
                "https://cdnjs.cloudflare.com",  // Font Awesome, Bootstrap
                "https://fonts.googleapis.com",  // Google Fonts
                "https://cdn.jsdelivr.net"
            ],
            
            // ✅ FIXED: Add CDN domains for fonts
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",     // Google Fonts
                "https://cdnjs.cloudflare.com"   // Font Awesome
            ],
            
            // Images can come from self, data URIs, or HTTPS
            imgSrc: ["'self'", "data:", "https:"],
            
            // Only connect to same origin
            connectSrc: ["'self'"],
            
            // Disable plugins
            objectSrc: ["'none'"],
            
            // Disable framing
            frameSrc: ["'none'"]
        }
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    // ✅ FIXED: Removed deprecated xssFilter
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    },
    permittedCrossDomainPolicies: false
});

/**
 * ✅ FIXED: Per-IP Rate Limiter with Redis Store
 */
export const createIpRateLimiter = () => {
    const store = redisConnected ? new RedisStore({
        client: redisClient,
        prefix: 'rl:ip:',
        expiry: 15 * 60
    }) : undefined;
    
    return rateLimit({
        store: store,
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.path === '/health',
        handler: (req, res) => {
            logger.warn('IP rate limit exceeded', { ip: req.ip, path: req.path });
            res.status(429).json({
                error: 'Too many requests from this IP',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: req.rateLimit.resetTime
            });
        }
    });
};

/**
 * ✅ FIXED: Per-User Rate Limiter with Redis Store
 */
export const createUserRateLimiter = () => {
    const store = redisConnected ? new RedisStore({
        client: redisClient,
        prefix: 'rl:user:',
        expiry: 15 * 60
    }) : undefined;
    
    return rateLimit({
        store: store,
        windowMs: 15 * 60 * 1000,
        max: 50,
        keyGenerator: (req) => {
            return req.user?.id ? `user_${req.user.id}` : req.ip;
        },
        message: 'Too many requests from this user, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn('User rate limit exceeded', { userId: req.user?.id, path: req.path });
            res.status(429).json({
                error: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: req.rateLimit.resetTime
            });
        }
    });
};

/**
 * ✅ FIXED: Login Attempt Rate Limiter with Redis Store
 */
export const createLoginRateLimiter = () => {
    const store = redisConnected ? new RedisStore({
        client: redisClient,
        prefix: 'rl:login:',
        expiry: 15 * 60
    }) : undefined;
    
    return rateLimit({
        store: store,
        windowMs: 15 * 60 * 1000,
        max: 5,
        keyGenerator: (req) => {
            return req.body?.email ? `login_${req.body.email}` : `login_${req.ip}`;
        },
        message: 'Too many login attempts, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn('Login rate limit exceeded', { ip: req.ip });
            res.status(429).json({
                error: 'Too many login attempts. Please try again later.',
                code: 'LOGIN_RATE_LIMIT_EXCEEDED',
                retryAfter: req.rateLimit.resetTime
            });
        }
    });
};

/**
 * ✅ FIXED: Account Lock System with Redis Support
 */
class AccountLockManager {
    constructor(redisClient = null) {
        this.redisClient = redisClient;
        this.MAX_ATTEMPTS = 5;
        this.LOCK_DURATION = 15 * 60;
        this.failedAttempts = new Map();
    }
    
    async recordFailedAttempt(email) {
        if (this.redisClient && redisConnected) {
            const key = `login_attempts:${email}`;
            const attempts = await this.redisClient.incr(key);
            
            if (attempts === 1) {
                await this.redisClient.expire(key, this.LOCK_DURATION);
            }
            
            if (attempts >= this.MAX_ATTEMPTS) {
                await this.redisClient.setex(
                    `account_locked:${email}`,
                    this.LOCK_DURATION,
                    'true'
                );
                logger.warn('Account locked due to failed login attempts', { email });
            }
            
            return attempts;
        } else {
            const current = this.failedAttempts.get(email) || { count: 0, lockedUntil: null };
            current.count += 1;
            
            if (current.count >= this.MAX_ATTEMPTS) {
                current.lockedUntil = Date.now() + (this.LOCK_DURATION * 1000);
                logger.warn('Account locked due to failed login attempts', { email });
            }
            
            this.failedAttempts.set(email, current);
            return current.count;
        }
    }
    
    async isLocked(email) {
        if (this.redisClient && redisConnected) {
            const locked = await this.redisClient.get(`account_locked:${email}`);
            return locked === 'true';
        } else {
            const current = this.failedAttempts.get(email);
            
            if (!current || !current.lockedUntil) {
                return false;
            }
            
            if (Date.now() > current.lockedUntil) {
                this.failedAttempts.delete(email);
                return false;
            }
            
            return true;
        }
    }
    
    async getRemainingLockTime(email) {
        if (this.redisClient && redisConnected) {
            const ttl = await this.redisClient.ttl(`account_locked:${email}`);
            return Math.max(0, ttl);
        } else {
            const current = this.failedAttempts.get(email);
            
            if (!current || !current.lockedUntil) {
                return 0;
            }
            
            const remaining = current.lockedUntil - Date.now();
            return Math.max(0, Math.ceil(remaining / 1000));
        }
    }
    
    async resetAttempts(email) {
        if (this.redisClient && redisConnected) {
            await this.redisClient.del(`login_attempts:${email}`);
            await this.redisClient.del(`account_locked:${email}`);
        } else {
            this.failedAttempts.delete(email);
        }
    }
}

/**
 * ✅ FIXED: Account Lock Middleware
 */
export const accountLockMiddleware = async (req, res, next) => {
    const email = req.body?.email;
    
    if (!email) {
        return next();
    }
    
    try {
        const manager = getAccountLockManager();
        const isLocked = await manager.isLocked(email);
        
        if (isLocked) {
            const remainingTime = await manager.getRemainingLockTime(email);
            logger.warn('Login attempt on locked account', { remainingTime });
            
            return res.status(429).json({
                error: `Account locked. Try again in ${remainingTime} seconds`,
                code: 'ACCOUNT_LOCKED',
                remainingTime
            });
        }
    } catch (err) {
        logger.error('Account lock check failed', { error: err.message });
    }
    
    next();
};

/**
 * ✅ FIXED: Request Size Limiting Middleware
 */
export const requestSizeLimiter = (req, res, next) => {
    const maxSize = 10 * 1024 * 1024;
    
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
        logger.warn('Request size exceeds limit', { 
            size: req.headers['content-length'],
            maxSize 
        });
        
        return res.status(413).json({
            error: 'Request payload too large',
            code: 'PAYLOAD_TOO_LARGE',
            maxSize
        });
    }
    
    next();
};

/**
 * ✅ FIXED: Security Headers Middleware
 */
export const securityMiddleware = [
    helmetConfig,
    requestSizeLimiter
];

export default {
    initializeRedis,
    initAccountLockManager,
    getAccountLockManager,
    generateCSRFToken,
    csrfProtection,
    helmetConfig,
    createIpRateLimiter,
    createUserRateLimiter,
    createLoginRateLimiter,
    accountLockMiddleware,
    requestSizeLimiter,
    securityMiddleware
};
