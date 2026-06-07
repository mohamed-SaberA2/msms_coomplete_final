/**
 * Authentication Controller - v4.0 Production Ready
 * Handles all auth-related requests
 */

import * as authService from '../services/authService-v4.js';
import { logger, logAuthEvent, maskEmail } from '../utils/logger-v4.js';

/**
 * Register new user
 */
export const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        const userId = await authService.registerUser(name, email, password, role);

        res.status(201).json({
            message: 'User registered successfully',
            userId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await authService.loginUser(email, password);

        res.json({
            message: 'Login successful',
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Refresh access token
 * GAP 1 FIX: Complete refresh token endpoint
 */
export const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const accessToken = await authService.refreshAccessToken(refreshToken);

        res.json({
            message: 'Token refreshed successfully',
            accessToken
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout user
 */
export const logout = async (req, res, next) => {
    try {
        await authService.logoutUser(req.user.id);

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user
 */
export const getMe = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.user.id);

        res.json({ user });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res, next) => {
    try {
        const { name, email } = req.body;

        await authService.updateUserProfile(req.user.id, { name, email });

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Change password
 */
export const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Old and new password required' });
        }

        await authService.changePassword(req.user.id, oldPassword, newPassword);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Deactivate account
 */
export const deactivateAccount = async (req, res, next) => {
    try {
        await authService.deactivateUser(req.user.id);

        res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
        next(error);
    }
};

export default {
    register,
    login,
    refresh,
    logout,
    getMe,
    updateProfile,
    changePassword,
    deactivateAccount
};
