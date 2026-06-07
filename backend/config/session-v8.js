/**
 * Session Configuration - v8.0
 * ✅ FIXED: Real session management with express-session and Redis store
 */

import session from 'express-session';
import RedisStore from 'connect-redis';
import redis from 'redis';
import { logger } from '../utils/logger-v4.js';

// ✅ FIXED: Create Redis client for session store
let redisClient = null;
let sessionStore = null;

export const initializeSessionStore = async () => {
    try {
        // Create Redis client for sessions
        redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 500)
            }
        });
        
        redisClient.on('error', (err) => {
            logger.error('Redis session store error:', err.message);
        });
        
        // ✅ FIXED: Properly connect Redis client
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
 * ✅ FIXED: Session middleware configuration
 * Uses Redis store for distributed sessions
 */
export const sessionMiddleware = async () => {
    // Initialize session store
    const store = await initializeSessionStore();
    
    return session({
        store: store || undefined,  // Use Redis store if available
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
    sessionMiddleware,
    refreshSessionMiddleware,
    validateSessionMiddleware
};
