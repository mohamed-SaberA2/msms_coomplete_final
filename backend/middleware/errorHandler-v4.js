/**
 * Error Handler Middleware - v4.0 Production Ready
 * MUST be placed at the END of all middleware/routes
 */

import { logger, logError } from '../utils/logger-v4.js';

/**
 * Async handler wrapper
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler
 * CRITICAL: This MUST be the last middleware
 */
export const errorHandler = (error, req, res, next) => {
    // Log error with masking
    logError(error, {
        method: req.method,
        url: req.url,
        userId: req.user?.id
    });

    // Determine status code
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';

    // Handle specific error types
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
    } else if (error.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    } else if (error.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Forbidden';
    } else if (error.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Not found';
    } else if (error.name === 'ConflictError') {
        statusCode = 409;
        message = 'Conflict';
    } else if (error.message === 'Email already registered') {
        statusCode = 409;
        message = 'Email already registered';
    } else if (error.message === 'Email already in use') {
        statusCode = 409;
        message = 'Email already in use';
    } else if (error.message === 'Invalid email or password') {
        statusCode = 401;
        message = 'Invalid email or password';
    } else if (error.message === 'User not found') {
        statusCode = 404;
        message = 'User not found';
    } else if (error.message === 'Patient not found') {
        statusCode = 404;
        message = 'Patient not found';
    } else if (error.message === 'File not found') {
        statusCode = 404;
        message = 'File not found';
    } else if (error.message === 'Access token required') {
        statusCode = 401;
        message = 'Access token required';
    } else if (error.message === 'Access token expired') {
        statusCode = 401;
        message = 'Access token expired';
    } else if (error.message === 'Invalid token') {
        statusCode = 403;
        message = 'Invalid token';
    } else if (error.message === 'Refresh token required') {
        statusCode = 400;
        message = 'Refresh token required';
    } else if (error.message === 'Invalid or revoked refresh token') {
        statusCode = 401;
        message = 'Invalid or revoked refresh token';
    } else if (error.message === 'Refresh token expired') {
        statusCode = 401;
        message = 'Refresh token expired';
    } else if (error.message === 'Insufficient permissions') {
        statusCode = 403;
        message = 'Insufficient permissions';
    } else if (error.message === 'User not authenticated') {
        statusCode = 401;
        message = 'User not authenticated';
    } else if (error.message === 'Missing required fields') {
        statusCode = 400;
        message = 'Missing required fields';
    } else if (error.message === 'Invalid gender. Must be male, female, or other') {
        statusCode = 400;
        message = 'Invalid gender. Must be male, female, or other';
    } else if (error.message === 'File type not allowed') {
        statusCode = 400;
        message = error.message;
    } else if (error.message === 'No file provided') {
        statusCode = 400;
        message = 'No file provided';
    } else if (error.message === 'Patient ID required') {
        statusCode = 400;
        message = 'Patient ID required';
    } else if (error.message === 'Search query required') {
        statusCode = 400;
        message = 'Search query required';
    }

    // Send error response
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

/**
 * 404 handler
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
};

export default {
    asyncHandler,
    errorHandler,
    notFoundHandler
};
