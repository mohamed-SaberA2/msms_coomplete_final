import jwt from 'jsonwebtoken';

// ============ AUTHENTICATION MIDDLEWARE ============

export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ error: 'Token expired' });
                }
                return res.status(403).json({ error: 'Invalid token' });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};

// ============ AUTHORIZATION MIDDLEWARE ============

export const authorize = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ 
                    error: 'Insufficient permissions',
                    requiredRoles: roles,
                    userRole: req.user.role
                });
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({ error: 'Authorization error' });
        }
    };
};

export default { authenticateToken, authorize };
