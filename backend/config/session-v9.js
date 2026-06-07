/**
 * Session Configuration - v9.0
 * ✅ FIXED: Separate initialization from middleware creation
 */

import session from 'express-session';
import RedisStore from 'connect-redis';
import redis from 'redis';
import { logger } from '../utils/logger-v4.js';

// ✅ FIXED: Initialize as null, set after Redis connects
let redisClient = null;
let sessionStore = null;
let sessionMiddleware = null;

/**
 * ✅ FIXED: Initialize session store separately
 * This must be called BEFORE creating the middleware
 */
export const initializeSessionStore = async () => {
    try {
        // Create Redis client for sessions
        // ✅ FIXED: Modern Redis client configuration
        redisClient = redis.createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                reconnectStrategy: (retries) => Math.min(retries * 50, 500)
            },
            password: process.env.REDIS_PASSWORD || undefined
        });
        
        redisClient.on('error', (err) => {
            logger.error('Redis session store error:', err.message);
        });
        
        // ✅ Properly connect Redis client
        await redisClient.connect();
        logger.info('Redis session store connected');
        
        // Create session store
        sessionStore = new RedisStore({
            client: redisClient,
            prefix: 'session:',
            ttl: 24 * 60 * 60  // 24 hours
        });
        
        return sessionStore;
    } catch (err) {
        logger.warn('Redis session store initialization failed, using memory store', { 
            error: err.message 
        });
        // Will use memory store as fallback
        return null;
    }
};

/**
 * ✅ FIXED: Create session middleware (synchronously)
 * This should be called AFTER initializeSessionStore()
 */
export const createSessionMiddleware = () => {
    if (sessionMiddleware) {
        return sessionMiddleware;
    }
    
    sessionMiddleware = session({
        store: sessionStore || undefined,  // Use Redis store if available
        secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        proxy: true,  // Trust proxy (for HTTPS behind load balancer)
        cookie: {
            secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
            httpOnly: true,  // Not accessible from JavaScript
            sameSite: 'strict',  // CSRF protection
            maxAge: 24 * 60 * 60 * 1000,  // 24 hours
            domain: process.env.COOKIE_DOMAIN || undefined
        },
        name: 'app_session_id'  // Custom session cookie name
    });
    
    return sessionMiddleware;
};

/**
 * ✅ FIXED: Get session middleware instance
 */
export const getSessionMiddleware = () => {
    if (!sessionMiddleware) {
        throw new Error('Session middleware not initialized. Call createSessionMiddleware() first.');
    }
    return sessionMiddleware;
};

/**
 * ✅ FIXED: Refresh session middleware
 * Extends session expiry on each request
 */
export const refreshSessionMiddleware = (req, res, next) => {
    if (req.session) {
        // Reset maxAge to extend session
        req.session.touch();
    }
    next();
};

/**
 * ✅ FIXED: Session validation middleware
 * Ensures session is valid before processing requests
 */
export const validateSessionMiddleware = (req, res, next) => {
    if (!req.session) {
        logger.warn('Session not initialized');
        return res.status(500).json({
            error: 'Session not initialized',
            code: 'SESSION_ERROR'
        });
    }
    
    next();
};

export default {
    initializeSessionStore,
    createSessionMiddleware,
    getSessionMiddleware,
    refreshSessionMiddleware,
    validateSessionMiddleware
};
