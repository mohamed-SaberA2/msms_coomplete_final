/**
 * Advanced Security Middleware - v12.0 FINAL SECURITY TIGHTENING
 * ✅ FIXED: CSP with nonce instead of unsafe-inline
 * ✅ FIXED: Tightened rate limits for medical system
 * ✅ FIXED: IP whitelisting for admin endpoints
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import crypto from 'crypto';
import redis from 'redis';
import { logger } from '../utils/logger-v4.js';

let redisClient = null;
let redisConnected = false;

export const initializeRedis = async () => {
    try {
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
 * ✅ FIXED: CSP Nonce Middleware
 * Generates unique nonce for each request for inline scripts
 */
export const csrfNonceMiddleware = (req, res, next) => {
    // ✅ Generate unique nonce for this request
    res.locals.nonce = crypto.randomBytes(16).toString('hex');
    next();
};

/**
 * ✅ FIXED: Helmet configuration with CSP nonce
 * Instead of unsafe-inline, use nonce for inline styles
 */
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            
            scriptSrc: [
                "'self'",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "https://unpkg.com"
            ],
            
            // ✅ FIXED: Use nonce instead of unsafe-inline
            styleSrc: [
                "'self'",
                (req, res) => `'nonce-${res.locals.nonce}'`,  // Nonce for inline styles
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net"
            ],
            
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com"
            ],
            
            imgSrc: ["'self'", "data:", "https:"],
            
            // ✅ FIXED: Allow external APIs
            connectSrc: [
                "'self'",
                process.env.EXTERNAL_API_URL ? new URL(process.env.EXTERNAL_API_URL).origin : null,
                "https://analytics.yourdomain.com",
                "https://api.stripe.com",
                "https://api.twilio.com"
            ].filter(Boolean),
            
            objectSrc: ["'none'"],
            frameSrc: ["'none'"]
        }
    },
    frameguard: { action: 'deny' },
    noSniff: true,
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
 * ✅ FIXED: Tightened IP rate limiter for medical system
 * Reduced from 100 to 50 requests per 15 minutes
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
        max: 50,  // ✅ FIXED: Reduced from 100
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
 * ✅ FIXED: Tightened user rate limiter for medical system
 * Reduced from 50 to 30 requests per 15 minutes
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
        max: 30,  // ✅ FIXED: Reduced from 50
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
 * ✅ FIXED: Sensitive API rate limiter
 * Much tighter limits for sensitive operations
 */
export const createSensitiveApiRateLimiter = () => {
    const store = redisConnected ? new RedisStore({
        client: redisClient,
        prefix: 'rl:sensitive:',
        expiry: 15 * 60
    }) : undefined;
    
    return rateLimit({
        store: store,
        windowMs: 15 * 60 * 1000,
        max: 10,  // ✅ FIXED: Very tight for sensitive operations
        keyGenerator: (req) => {
            return req.user?.id ? `sensitive_${req.user.id}` : `sensitive_${req.ip}`;
        },
        message: 'Too many sensitive requests, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn('Sensitive API rate limit exceeded', { 
                userId: req.user?.id, 
                path: req.path,
                ip: req.ip 
            });
            res.status(429).json({
                error: 'Too many sensitive requests. Please try again later.',
                code: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
                retryAfter: req.rateLimit.resetTime
            });
        }
    });
};

/**
 * ✅ FIXED: Login attempt rate limiter
 * Kept tight at 5 attempts per 15 minutes
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
        max: 5,  // ✅ FIXED: Kept tight for login
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
 * ✅ FIXED: IP Whitelist middleware for admin endpoints
 */
export const ipWhitelistMiddleware = (allowedIps = []) => {
    return (req, res, next) => {
        const clientIp = req.ip || req.connection.remoteAddress;
        
        // ✅ Add localhost for development
        const allowedIpList = [
            'localhost',
            '127.0.0.1',
            '::1',
            ...allowedIps
        ];
        
        if (!allowedIpList.includes(clientIp)) {
            logger.warn('IP whitelist violation', { 
                clientIp, 
                path: req.path,
                userId: req.user?.id 
            });
            
            return res.status(403).json({
                error: 'Access denied from your IP address',
                code: 'IP_NOT_WHITELISTED'
            });
        }
        
        next();
    };
};

/**
 * ✅ FIXED: Admin endpoint protection
 * Combines authentication, authorization, and IP whitelisting
 */
export const adminProtection = [
    (req, res, next) => {
        // ✅ Check authentication
        if (!req.user) {
            return res.status(401).json({
                error: 'Not authenticated',
                code: 'NOT_AUTHENTICATED'
            });
        }
        
        // ✅ Check authorization
        if (req.user.role !== 'admin') {
            logger.warn('Unauthorized admin access attempt', { 
                userId: req.user.id,
                role: req.user.role,
                path: req.path
            });
            
            return res.status(403).json({
                error: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        
        next();
    },
    ipWhitelistMiddleware(process.env.ADMIN_IPS ? process.env.ADMIN_IPS.split(',') : [])
];

/**
 * ✅ FIXED: Request size limiting middleware
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
 * ✅ FIXED: Security headers middleware
 */
export const securityMiddleware = [
    csrfNonceMiddleware,
    helmetConfig,
    requestSizeLimiter
];

export default {
    initializeRedis,
    csrfNonceMiddleware,
    helmetConfig,
    createIpRateLimiter,
    createUserRateLimiter,
    createSensitiveApiRateLimiter,
    createLoginRateLimiter,
    ipWhitelistMiddleware,
    adminProtection,
    requestSizeLimiter,
    securityMiddleware
};
