/**
 * Session Configuration - v12.0 FINAL SECURITY TIGHTENING
 * ✅ FIXED: SameSite=Strict for CSRF protection
 * ✅ FIXED: Secure flag in production
 * ✅ FIXED: HttpOnly flag enabled
 */

import session from 'express-session';
import RedisStore from 'connect-redis';
import redis from 'redis';
import { logger } from '../utils/logger-v4.js';

let redisClient = null;
let sessionStore = null;

/**
 * ✅ FIXED: Initialize session store with Redis
 */
export const initializeSessionStore = async () => {
    try {
        // Create Redis client for sessions
        redisClient = redis.createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                reconnectStrategy: (retries) => Math.min(retries * 50, 500)
            },
            password: process.env.REDIS_PASSWORD || undefined
        });
        
        redisClient.on('error', (err) => {
            logger.error('Redis session connection error:', err.message);
        });
        
        await redisClient.connect();
        logger.info('Redis session store connected');
        
        // Create session store
        sessionStore = new RedisStore({
            client: redisClient,
            prefix: 'session:',
            ttl: 24 * 60 * 60  // 24 hours
        });
        
        logger.info('Session store initialized with Redis');
        return sessionStore;
    } catch (err) {
        logger.error('Session store initialization failed', { error: err.message });
        throw err;
    }
};

/**
 * ✅ FIXED: Create session middleware with strict security
 */
export const createSessionMiddleware = () => {
    if (!sessionStore) {
        throw new Error('Session store not initialized. Call initializeSessionStore() first.');
    }
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    return session({
        store: sessionStore,
        secret: process.env.SESSION_SECRET || 'development-secret-key-change-in-production',
        name: 'app_session_id',
        resave: false,
        saveUninitialized: false,
        proxy: isProduction,  // Trust proxy in production
        cookie: {
            // ✅ FIXED: Strict SameSite for CSRF protection
            sameSite: 'strict',
            
            // ✅ FIXED: Secure flag in production (HTTPS only)
            secure: isProduction,
            
            // ✅ FIXED: HttpOnly flag (not accessible from JavaScript)
            httpOnly: true,
            
            // ✅ FIXED: Domain setting
            domain: process.env.COOKIE_DOMAIN || undefined,
            
            // ✅ FIXED: Session expiry (24 hours)
            maxAge: 24 * 60 * 60 * 1000,
            
            // ✅ FIXED: Path restriction
            path: '/'
        }
    });
};

/**
 * ✅ FIXED: Session validation middleware
 * Ensures session is valid and not expired
 */
export const validateSession = (req, res, next) => {
    if (!req.session) {
        logger.warn('Session middleware not applied', { path: req.path });
        return res.status(500).json({
            error: 'Session middleware not configured',
            code: 'SESSION_NOT_CONFIGURED'
        });
    }
    
    // ✅ Check if session has user data
    if (req.session.userId) {
        // ✅ Refresh session TTL on each request
        req.session.touch();
    }
    
    next();
};

/**
 * ✅ FIXED: Session refresh middleware
 * Regenerates session ID periodically for security
 */
export const sessionRefresh = (req, res, next) => {
    if (!req.session) {
        return next();
    }
    
    // ✅ Regenerate session ID every 1 hour
    const lastRegenerated = req.session.lastRegenerated || 0;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (now - lastRegenerated > oneHour) {
        req.session.regenerate((err) => {
            if (err) {
                logger.error('Session regeneration failed', { error: err.message });
                return next();
            }
            
            req.session.lastRegenerated = now;
            logger.debug('Session regenerated for security', { userId: req.session.userId });
            next();
        });
    } else {
        next();
    }
};

export default {
    initializeSessionStore,
    createSessionMiddleware,
    validateSession,
    sessionRefresh
};
