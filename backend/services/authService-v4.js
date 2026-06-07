/**
 * Authentication Service - v4.0 Production Ready
 * GAP 1 FIX: Complete refresh token system with DB storage and revocation
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { executeQuery, executeTransaction } from '../utils/database-v4.js';
import { logger, logAuthEvent, maskEmail } from '../utils/logger-v4.js';
import { auditLog } from './auditService-v4.js';

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Hash a refresh token for secure storage
 */
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Register a new user
 */
export const registerUser = async (name, email, password, role = 'user') => {
    try {
        // Check if user exists
        const existing = await executeQuery(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            logAuthEvent(email, 'REGISTER', false);
            throw new Error('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await executeQuery(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        logAuthEvent(email, 'REGISTER', true);
        await auditLog(result.insertId, 'REGISTER', 'users', result.insertId, { role });

        logger.info(`New user registered: ${maskEmail(email)}`);
        return result.insertId;
    } catch (error) {
        logger.error(`Registration failed for ${maskEmail(email)}:`, error);
        throw error;
    }
};

/**
 * Login user and generate tokens
 * GAP 1 FIX: Store refresh token in database
 */
export const loginUser = async (email, password) => {
    try {
        // Get user
        const users = await executeQuery(
            'SELECT id, name, email, password, role FROM users WHERE email = ? AND is_active = TRUE',
            [email]
        );

        if (users.length === 0) {
            logAuthEvent(email, 'LOGIN', false);
            throw new Error('Invalid email or password');
        }

        const user = users[0];

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            logAuthEvent(email, 'LOGIN', false);
            throw new Error('Invalid email or password');
        }

        // Generate access token (short-lived)
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );

        // Generate refresh token (long-lived)
        const refreshToken = jwt.sign(
            { id: user.id },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRY }
        );

        // Store refresh token hash in database
        const tokenHash = hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await executeQuery(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
            [user.id, tokenHash, expiresAt]
        );

        logAuthEvent(email, 'LOGIN', true);
        await auditLog(user.id, 'LOGIN', 'users', user.id, {});

        logger.info(`User logged in: ${maskEmail(email)}`);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        };
    } catch (error) {
        logger.error(`Login failed for ${maskEmail(email)}:`, error);
        throw error;
    }
};

/**
 * Refresh access token
 * GAP 1 FIX: Validate stored refresh token
 */
export const refreshAccessToken = async (refreshToken) => {
    try {
        if (!refreshToken) {
            throw new Error('Refresh token required');
        }

        // Verify token signature
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh token expired');
            }
            throw new Error('Invalid refresh token');
        }

        // Check if token is stored and not revoked
        const tokenHash = hashToken(refreshToken);
        const storedTokens = await executeQuery(
            `SELECT id FROM refresh_tokens 
             WHERE user_id = ? AND token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()`,
            [decoded.id, tokenHash]
        );

        if (storedTokens.length === 0) {
            throw new Error('Invalid or revoked refresh token');
        }

        // Get user
        const users = await executeQuery(
            'SELECT id, email, role FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.id]
        );

        if (users.length === 0) {
            throw new Error('User not found or inactive');
        }

        const user = users[0];

        // Generate new access token
        const newAccessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );

        logger.info(`Access token refreshed for user #${user.id}`);

        return newAccessToken;
    } catch (error) {
        logger.error('Token refresh failed:', error);
        throw error;
    }
};

/**
 * Logout user and revoke all refresh tokens
 * GAP 1 FIX: Actual token revocation
 */
export const logoutUser = async (userId) => {
    try {
        // Revoke all refresh tokens for this user
        await executeQuery(
            'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
            [userId]
        );

        await auditLog(userId, 'LOGOUT', 'users', userId, {});

        logger.info(`User #${userId} logged out - all tokens revoked`);
    } catch (error) {
        logger.error('Logout failed:', error);
        throw error;
    }
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Access token expired');
        }
        throw new Error('Invalid access token');
    }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
    try {
        const users = await executeQuery(
            'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            throw new Error('User not found');
        }

        return users[0];
    } catch (error) {
        logger.error('Failed to get user:', error);
        throw error;
    }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
    try {
        const { name, email, phone } = updates;

        // Check if email is already taken
        if (email) {
            const existing = await executeQuery(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );

            if (existing.length > 0) {
                throw new Error('Email already in use');
            }
        }

        // Update user
        await executeQuery(
            'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?',
            [name, email, userId]
        );

        await auditLog(userId, 'UPDATE_PROFILE', 'users', userId, { email: email ? maskEmail(email) : undefined });

        logger.info(`User #${userId} profile updated`);
    } catch (error) {
        logger.error('Profile update failed:', error);
        throw error;
    }
};

/**
 * Change password
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
    try {
        // Get user
        const users = await executeQuery(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            throw new Error('User not found');
        }

        // Verify old password
        const passwordMatch = await bcrypt.compare(oldPassword, users[0].password);

        if (!passwordMatch) {
            throw new Error('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await executeQuery(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        // Revoke all refresh tokens on password change
        await executeQuery(
            'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
            [userId]
        );

        await auditLog(userId, 'CHANGE_PASSWORD', 'users', userId, {});

        logger.info(`User #${userId} changed password`);
    } catch (error) {
        logger.error('Password change failed:', error);
        throw error;
    }
};

/**
 * Deactivate user account
 */
export const deactivateUser = async (userId) => {
    try {
        await executeTransaction(async (connection) => {
            // Deactivate user
            await connection.execute(
                'UPDATE users SET is_active = FALSE WHERE id = ?',
                [userId]
            );

            // Revoke all refresh tokens
            await connection.execute(
                'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
                [userId]
            );
        });

        await auditLog(userId, 'DEACTIVATE_ACCOUNT', 'users', userId, {});

        logger.info(`User #${userId} account deactivated`);
    } catch (error) {
        logger.error('Account deactivation failed:', error);
        throw error;
    }
};

export default {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    verifyAccessToken,
    getUserById,
    updateUserProfile,
    changePassword,
    deactivateUser
};
