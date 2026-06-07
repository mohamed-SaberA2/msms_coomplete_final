/**
 * Authentication Middleware - v10.0
 * ✅ FIXED: Sessions only (no JWT for monolithic web app)
 * 
 * For a traditional monolithic web app:
 * - Use sessions stored in Redis
 * - Use cookies for authentication
 * - Use CSRF tokens for state-changing requests
 * - No JWT needed
 */

import { logger } from '../utils/logger-v4.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors-v5.js';

/**
 * ✅ FIXED: Session-based authentication middleware
 * Replaces JWT-based authentication
 * 
 * For monolithic web apps:
 * - Sessions are stored in Redis
 * - Cookies are sent automatically
 * - No Authorization header needed
 * - CSRF tokens protect state-changing requests
 */
export const authenticateSession = (req, res, next) => {
    try {
        // ✅ Check if session exists and has user data
        if (!req.session || !req.session.userId) {
            logger.warn('Unauthenticated request', { path: req.path });
            return res.status(401).json({
                error: 'Not authenticated',
                code: 'NOT_AUTHENTICATED'
            });
        }
        
        // ✅ Attach user info to request
        req.user = {
            id: req.session.userId,
            email: req.session.email,
            role: req.session.role
        };
        
        logger.info('User authenticated via session', { 
            userId: req.user.id,
            path: req.path
        });
        
        next();
    } catch (err) {
        logger.error('Authentication error', { error: err.message });
        res.status(500).json({
            error: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
};

/**
 * ✅ FIXED: Role-based authorization middleware
 * Works with session-based authentication
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // ✅ Check if user is authenticated
            if (!req.user) {
                logger.warn('Authorization check on unauthenticated request', { path: req.path });
                return res.status(401).json({
                    error: 'Not authenticated',
                    code: 'NOT_AUTHENTICATED'
                });
            }
            
            // ✅ Check if user has required role
            if (!allowedRoles.includes(req.user.role)) {
                logger.warn('Authorization denied - insufficient role', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    requiredRoles: allowedRoles,
                    path: req.path
                });
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    requiredRoles: allowedRoles
                });
            }
            
            logger.info('Authorization granted', {
                userId: req.user.id,
                userRole: req.user.role,
                path: req.path
            });
            
            next();
        } catch (err) {
            logger.error('Authorization error', { error: err.message });
            res.status(500).json({
                error: 'Authorization failed',
                code: 'AUTH_ERROR'
            });
        }
    };
};

/**
 * ✅ FIXED: Optional authentication middleware
 * Doesn't fail if user is not authenticated
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
export const optionalAuth = (req, res, next) => {
    try {
        // ✅ Try to get user from session
        if (req.session && req.session.userId) {
            req.user = {
                id: req.session.userId,
                email: req.session.email,
                role: req.session.role
            };
            logger.info('Optional auth - user authenticated', { userId: req.user.id });
        } else {
            req.user = null;
            logger.info('Optional auth - user not authenticated');
        }
        
        next();
    } catch (err) {
        logger.error('Optional auth error', { error: err.message });
        req.user = null;
        next();
    }
};

/**
 * ✅ FIXED: Admin-only middleware
 * Shorthand for authorize('admin')
 */
export const adminOnly = authorize('admin');

/**
 * ✅ FIXED: Staff-only middleware
 * Shorthand for authorize('admin', 'staff')
 */
export const staffOnly = authorize('admin', 'staff');

/**
 * ✅ FIXED: Doctor-only middleware
 * Shorthand for authorize('admin', 'doctor')
 */
export const doctorOnly = authorize('admin', 'doctor');

/**
 * ✅ FIXED: Logout middleware
 * Clears session data
 */
export const logout = (req, res, next) => {
    try {
        if (req.session) {
            const userId = req.session.userId;
            
            // ✅ Destroy session
            req.session.destroy((err) => {
                if (err) {
                    logger.error('Session destruction error', { error: err.message });
                    return res.status(500).json({
                        error: 'Logout failed',
                        code: 'LOGOUT_ERROR'
                    });
                }
                
                logger.info('User logged out', { userId });
                
                // ✅ Clear session cookie
                res.clearCookie('app_session_id');
                
                res.json({
                    message: 'Logged out successfully',
                    code: 'LOGOUT_SUCCESS'
                });
            });
        } else {
            res.json({
                message: 'Not logged in',
                code: 'NOT_LOGGED_IN'
            });
        }
    } catch (err) {
        logger.error('Logout error', { error: err.message });
        res.status(500).json({
            error: 'Logout failed',
            code: 'LOGOUT_ERROR'
        });
    }
};

export default {
    authenticateSession,
    authorize,
    optionalAuth,
    adminOnly,
    staffOnly,
    doctorOnly,
    logout
};
