/**
 * Authentication Middleware - v4.0 Production Ready
 */

import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger-v4.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Authenticate token middleware
 */
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ error: 'Access token expired' });
                }
                logger.warn('Token verification failed:', err.message);
                return res.status(403).json({ error: 'Invalid token' });
            }

            req.user = user;
            next();
        });
    } catch (error) {
        logger.error('Authentication middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};

/**
 * Authorization middleware
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            if (!roles.includes(req.user.role)) {
                logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    requiredRoles: roles,
                    userRole: req.user.role
                });
            }

            next();
        } catch (error) {
            logger.error('Authorization middleware error:', error);
            res.status(500).json({ error: 'Authorization error' });
        }
    };
};

export default {
    authenticateToken,
    authorize
};
