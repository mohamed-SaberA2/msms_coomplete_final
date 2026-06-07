/**
 * Authentication Routes - v4.0 Production Ready
 */

import express from 'express';
import * as authController from '../controllers/authController-v4.js';
import * as validation from '../middleware/validation-v4.js';
import { authenticateToken } from '../middleware/auth-v4.js';
import { authLimiter } from '../middleware/rateLimiter-v4.js';

const router = express.Router();

/**
 * Public routes
 */

// Register
router.post(
    '/register',
    authLimiter,
    validation.validateRegister,
    validation.handleValidationErrors,
    authController.register
);

// Login
router.post(
    '/login',
    authLimiter,
    validation.validateLogin,
    validation.handleValidationErrors,
    authController.login
);

// Refresh token (GAP 1 FIX)
router.post(
    '/refresh',
    authController.refresh
);

/**
 * Protected routes
 */

// Get current user
router.get(
    '/me',
    authenticateToken,
    authController.getMe
);

// Update profile
router.put(
    '/profile',
    authenticateToken,
    validation.validateRegister,
    validation.handleValidationErrors,
    authController.updateProfile
);

// Change password
router.post(
    '/change-password',
    authenticateToken,
    authController.changePassword
);

// Logout
router.post(
    '/logout',
    authenticateToken,
    authController.logout
);

// Deactivate account
router.post(
    '/deactivate',
    authenticateToken,
    authController.deactivateAccount
);

export default router;
