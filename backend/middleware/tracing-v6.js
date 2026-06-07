/**
 * Request Tracing Middleware - v6.0
 * 🔥 Adds correlation IDs and request tracing for debugging
 */

import crypto from 'crypto';
import { logger } from '../utils/logger-v4.js';

/**
 * ✅ Generate Correlation ID
 * Unique ID for tracking request through entire system
 */
export const generateCorrelationId = () => {
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
};

/**
 * ✅ Correlation ID Middleware
 * Attaches correlation ID to every request
 * Logs request start and end
 */
export const correlationIdMiddleware = (req, res, next) => {
    // Generate or use existing correlation ID
    const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
    
    // Attach to request
    req.correlationId = correlationId;
    req.startTime = Date.now();
    
    // Attach to response headers
    res.setHeader('X-Correlation-ID', correlationId);
    
    // Log request start
    logger.info('Request started', {
        correlationId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
    
    // Capture response end
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - req.startTime;
        
        // Log request end
        logger.info('Request completed', {
            correlationId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.id
        });
        
        // Call original send
        return originalSend.call(this, data);
    };
    
    next();
};

/**
 * ✅ Request Context Middleware
 * Stores request context for use in services/controllers
 */
export const requestContextMiddleware = (req, res, next) => {
    req.context = {
        correlationId: req.correlationId,
        userId: req.user?.id,
        userRole: req.user?.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
    };
    
    next();
};

/**
 * ✅ Structured Logging Helper
 * Adds correlation ID to all logs
 */
export const withCorrelationId = (correlationId, data = {}) => {
    return {
        correlationId,
        ...data,
        timestamp: new Date().toISOString()
    };
};

/**
 * ✅ Request Timing Middleware
 * Logs slow requests for performance monitoring
 */
export const requestTimingMiddleware = (slowThreshold = 1000) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            const duration = Date.now() - req.startTime;
            
            // Log slow requests
            if (duration > slowThreshold) {
                logger.warn('Slow request detected', {
                    correlationId: req.correlationId,
                    method: req.method,
                    path: req.path,
                    duration: `${duration}ms`,
                    threshold: `${slowThreshold}ms`
                });
            }
            
            return originalSend.call(this, data);
        };
        
        next();
    };
};

/**
 * ✅ Error Tracing Middleware
 * Logs errors with correlation ID for easy debugging
 */
export const errorTracingMiddleware = (err, req, res, next) => {
    logger.error('Request error', {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        statusCode: err.statusCode || 500,
        error: err.message,
        code: err.code,
        stack: err.stack,
        userId: req.user?.id
    });
    
    next(err);
};

/**
 * ✅ Tracing Middleware Stack
 * Apply all tracing middleware
 */
export const tracingMiddleware = [
    correlationIdMiddleware,
    requestContextMiddleware,
    requestTimingMiddleware(1000) // Log requests slower than 1 second
];

export default {
    generateCorrelationId,
    correlationIdMiddleware,
    requestContextMiddleware,
    withCorrelationId,
    requestTimingMiddleware,
    errorTracingMiddleware,
    tracingMiddleware
};
