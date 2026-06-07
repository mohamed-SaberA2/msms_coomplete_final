// ============ ERROR HANDLER MIDDLEWARE ============

export const errorHandler = (err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        status: err.statusCode || 500,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { details: err.stack })
    });
};

// Async handler wrapper to catch errors in async routes
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default errorHandler;
