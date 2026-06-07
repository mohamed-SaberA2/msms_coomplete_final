# Gap Analysis: 8.5/10 → 9.5+/10 Production Ready

## Honest Assessment

Your current implementation is **excellent mid-level work** (8.5/10). It has solid fundamentals but lacks the polish and completeness of truly production-grade systems. This document identifies exactly what needs to be fixed to reach 9.5+/10.

---

## Gap 1: Incomplete Refresh Token System ⚠️ CRITICAL

### Current State (INCOMPLETE)

```javascript
// v3.0 generates tokens but:
const accessToken = jwt.sign(..., { expiresIn: '1h' });
const refreshToken = jwt.sign(..., { expiresIn: '7d' });

// ❌ MISSING:
// 1. No /api/auth/refresh endpoint
// 2. No refresh_tokens table (tokens not stored)
// 3. No token revocation on logout
// 4. No token blacklist
```

### What's Missing

| Component | Status | Impact |
|-----------|--------|--------|
| Generate tokens | ✅ Done | Tokens created |
| Store in DB | ❌ Missing | Can't revoke or track |
| /api/auth/refresh endpoint | ❌ Missing | Can't refresh tokens |
| Token revocation | ❌ Missing | Logout doesn't invalidate |
| Token blacklist | ❌ Missing | Revoked tokens still work |

### Production Solution

**1. Create refresh_tokens table:**
```sql
CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_revoked_at (revoked_at)
);
```

**2. Update login to store refresh token:**
```javascript
app.post('/api/auth/login', async (req, res) => {
    // ... existing validation ...
    
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    // STORE refresh token hash in DB
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await executeQuery(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [user.id, tokenHash, expiresAt]
    );

    res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role }
    });
});
```

**3. Create /api/auth/refresh endpoint:**
```javascript
app.post('/api/auth/refresh', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
    }

    try {
        // Verify token signature
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        // Check if token is stored and not revoked
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const storedTokens = await executeQuery(
            'SELECT * FROM refresh_tokens WHERE user_id = ? AND token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()',
            [decoded.id, tokenHash]
        );

        if (storedTokens.length === 0) {
            return res.status(401).json({ error: 'Invalid or revoked refresh token' });
        }

        // Generate new access token
        const user = await executeQuery('SELECT * FROM users WHERE id = ?', [decoded.id]);
        const newAccessToken = jwt.sign(
            { id: user[0].id, email: user[0].email, role: user[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        logger.error('Refresh token error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
}));
```

**4. Update logout to revoke tokens:**
```javascript
app.post('/api/auth/logout', authenticateToken, asyncHandler(async (req, res) => {
    // Revoke all refresh tokens for this user
    await executeQuery(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
        [req.user.id]
    );

    logger.info(`User ${req.user.id} logged out - all tokens revoked`);
    await auditLog(req.user.id, 'LOGOUT', 'users', req.user.id, {});
    
    res.json({ message: 'Logged out successfully' });
}));
```

### Frontend Implementation

```javascript
// Store tokens
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// Intercept 401 errors
async function apiCall(url, options = {}) {
    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
    });

    if (response.status === 401) {
        // Try to refresh
        const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                refreshToken: localStorage.getItem('refreshToken')
            })
        });

        if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            localStorage.setItem('accessToken', data.accessToken);
            
            // Retry original request
            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${data.accessToken}`
                }
            });
        } else {
            // Redirect to login
            window.location.href = '/login';
        }
    }

    return response;
}
```

---

## Gap 2: No Real SQL Transactions ⚠️ CRITICAL

### Current State (FAKE)

```javascript
// v3.0 claims transactions but:
export const executeTransaction = async (callback) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        // ❌ MISSING: await connection.beginTransaction();
        
        const result = await callback(connection);
        
        // ❌ MISSING: await connection.commit();
        return result;
    } catch (error) {
        // ❌ MISSING: await connection.rollback();
        throw error;
    }
};

// This is NOT a real transaction! It's just connection management.
```

### What's Missing

Real transactions need:
1. `BEGIN` - Start transaction
2. `COMMIT` - Save all changes
3. `ROLLBACK` - Undo all changes on error

### Production Solution

```javascript
export const executeTransaction = async (callback) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        
        // START TRANSACTION
        await connection.beginTransaction();
        
        // Execute callback with connection
        const result = await callback(connection);
        
        // COMMIT all changes
        await connection.commit();
        
        logger.info('Transaction committed successfully');
        return result;
    } catch (error) {
        if (connection) {
            // ROLLBACK on error
            try {
                await connection.rollback();
                logger.warn('Transaction rolled back due to error:', error.message);
            } catch (rollbackError) {
                logger.error('Rollback failed:', rollbackError);
            }
        }
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
```

### Real-World Example: Create Invoice + Medical Record

```javascript
app.post('/api/billing-with-record', 
    authenticateToken, 
    authorize('admin', 'staff'), 
    asyncHandler(async (req, res) => {
        const { patient_id, amount, diagnosis, treatment } = req.body;

        try {
            const result = await executeTransaction(async (connection) => {
                // Create invoice
                const [invoiceResult] = await connection.execute(
                    'INSERT INTO invoices (patient_id, amount, payment_status, created_at) VALUES (?, ?, ?, NOW())',
                    [patient_id, amount, 'pending']
                );

                // Create medical record
                const [recordResult] = await connection.execute(
                    'INSERT INTO medical_records (patient_id, doctor_id, visit_date, diagnosis, treatment) VALUES (?, ?, NOW(), ?, ?)',
                    [patient_id, req.user.id, diagnosis, treatment]
                );

                // Both succeed or both fail - ATOMIC
                return {
                    invoiceId: invoiceResult.insertId,
                    recordId: recordResult.insertId
                };
            });

            logger.info(`Invoice #${result.invoiceId} and Record #${result.recordId} created atomically`);
            res.status(201).json({ 
                message: 'Invoice and record created',
                invoiceId: result.invoiceId,
                recordId: result.recordId
            });
        } catch (error) {
            logger.error('Failed to create invoice and record:', error);
            res.status(500).json({ error: 'Failed to create invoice and record' });
        }
    })
);
```

### Why This Matters

**Without transactions:**
```
1. Create invoice ✅
2. Create medical record ❌ (error)
Result: Invoice exists but no record (DATA INCONSISTENT)
```

**With transactions:**
```
1. BEGIN
2. Create invoice ✅
3. Create medical record ❌ (error)
4. ROLLBACK (undo invoice)
Result: Both created or both rolled back (DATA CONSISTENT)
```

---

## Gap 3: Gender Enum Mismatch 🐛 BUG

### Current State (BROKEN)

**Validation (v3.0):**
```javascript
body('gender').isIn(['M', 'F', 'Other'])
```

**Database (schema.sql):**
```sql
gender ENUM('male', 'female', 'other')
```

### The Problem

```javascript
// Frontend sends: { gender: 'M' }
// Validation passes: ✅ 'M' is in ['M', 'F', 'Other']
// Database insert: ❌ 'M' is NOT in ('male', 'female', 'other')
// Result: MySQL error, request fails

// This is a CRITICAL BUG that breaks patient creation!
```

### Production Solution

**Option 1: Fix Validation (Recommended)**
```javascript
body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other')
```

**Option 2: Fix Database**
```sql
ALTER TABLE patients MODIFY gender ENUM('M', 'F', 'Other');
```

**Option 3: Transform in Code (Best Practice)**
```javascript
app.post('/api/patients', 
    authenticateToken, 
    authorize('admin', 'staff'), 
    createLimiter, 
    validatePatient, 
    handleValidationErrors, 
    asyncHandler(async (req, res) => {
        let { firstName, lastName, gender, dateOfBirth, phone, email, address } = req.body;

        // Normalize gender
        const genderMap = { 'M': 'male', 'F': 'female', 'Other': 'other' };
        gender = genderMap[gender] || gender;

        const result = await executeQuery(
            'INSERT INTO patients (first_name, last_name, gender, date_of_birth, phone, email, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [firstName, lastName, gender, dateOfBirth, phone, email, address]
        );

        res.status(201).json({ message: 'Patient created', patientId: result.insertId });
    })
);
```

---

## Gap 4: No XSS Protection 🔓 SECURITY

### Current State (VULNERABLE)

```javascript
// v3.0 has validation but NO XSS protection
app.use(express.json());
// ❌ Missing: XSS sanitization layer
```

### The Vulnerability

```javascript
// Attacker sends:
POST /api/patients
{
  "firstName": "<script>alert('XSS')</script>",
  "email": "test@example.com"
}

// Validation passes (it's a string)
// Stored in database as-is
// Frontend renders it → script executes
// Result: XSS attack successful
```

### Production Solution

**1. Install xss-clean:**
```bash
npm install xss-clean
```

**2. Add middleware:**
```javascript
import xss from 'xss-clean';

app.use(xss()); // Sanitize all inputs
```

**3. Manual sanitization for critical fields:**
```javascript
import DOMPurify from 'isomorphic-dompurify';

app.post('/api/patients', 
    authenticateToken, 
    asyncHandler(async (req, res) => {
        let { firstName, lastName, email, address } = req.body;

        // Sanitize HTML content
        firstName = DOMPurify.sanitize(firstName);
        lastName = DOMPurify.sanitize(lastName);
        address = DOMPurify.sanitize(address);

        // Validate email
        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email' });
        }

        // Insert sanitized data
        const result = await executeQuery(
            'INSERT INTO patients (first_name, last_name, email, address) VALUES (?, ?, ?, ?)',
            [firstName, lastName, email, address]
        );

        res.status(201).json({ message: 'Patient created', patientId: result.insertId });
    })
);
```

---

## Gap 5: Sensitive Data in Logs 🔓 SECURITY

### Current State (EXPOSED)

```javascript
// v3.0 logs sensitive data:
logger.info(`User logged in: ${email}`);
logger.info(`New user registered: ${email} with role: ${role}`);
logger.info(`Audit: User ${userId} performed ${action}`);

// ❌ Emails and user IDs in plain text logs
// ❌ If logs are compromised, attacker sees all user emails
```

### The Problem

```
Log file (error.log):
[2024-01-15T10:30:45.123Z] User logged in: admin@hospital.com
[2024-01-15T10:31:12.456Z] User logged in: doctor@hospital.com
[2024-01-15T10:32:33.789Z] New user registered: nurse@hospital.com

If attacker gets access to logs → has all user emails
```

### Production Solution

**Mask sensitive data:**
```javascript
// Utility function to mask email
const maskEmail = (email) => {
    const [name, domain] = email.split('@');
    const masked = name.substring(0, 2) + '*'.repeat(name.length - 2) + '@' + domain;
    return masked;
};

// Usage:
logger.info(`User logged in: ${maskEmail(email)}`);
// Output: User logged in: ad***@hospital.com

// Utility function to mask token
const maskToken = (token) => {
    if (!token || token.length < 10) return '***';
    return token.substring(0, 5) + '...' + token.substring(token.length - 5);
};

// Usage:
logger.debug(`Token: ${maskToken(accessToken)}`);
// Output: Token: eyJhb...2NjQ2
```

**Updated logging:**
```javascript
// Login
logger.info(`User logged in: ${maskEmail(email)}`);
await auditLog(user.id, 'LOGIN', 'users', user.id, { maskedEmail: maskEmail(email) });

// Register
logger.info(`New user registered: ${maskEmail(email)} with role: ${role}`);
await auditLog(result.insertId, 'REGISTER', 'users', result.insertId, { role });

// Audit
logger.info(`Audit: User #${userId} performed ${action} on ${resource} #${resourceId}`);

// Errors
logger.error('Database error:', error.message); // NOT error.stack in production
```

---

## Gap 6: No Layered Architecture 🏗️ MAINTAINABILITY

### Current State (MONOLITHIC)

```
server-v3-production.js (1100+ lines)
├── Middleware setup
├── Routes
├── Controllers logic
├── Database queries
├── Error handling
└── Everything mixed together
```

**Problems:**
- Hard to test individual components
- Hard to reuse logic
- Hard to scale
- Hard to maintain

### Production Solution: Layered Architecture

```
backend/
├── server.js (entry point, 50 lines)
├── config/
│   ├── database.js
│   ├── env.js
│   └── logger.js
├── middleware/
│   ├── auth.js
│   ├── validation.js
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   └── xss.js
├── routes/
│   ├── auth.js
│   ├── patients.js
│   ├── doctors.js
│   ├── appointments.js
│   ├── records.js
│   ├── billing.js
│   └── dashboard.js
├── controllers/
│   ├── authController.js
│   ├── patientController.js
│   ├── doctorController.js
│   ├── appointmentController.js
│   ├── recordController.js
│   ├── billingController.js
│   └── dashboardController.js
├── services/
│   ├── authService.js
│   ├── patientService.js
│   ├── doctorService.js
│   ├── appointmentService.js
│   ├── recordService.js
│   ├── billingService.js
│   └── auditService.js
├── utils/
│   ├── database.js
│   ├── logger.js
│   ├── validators.js
│   ├── formatters.js
│   └── crypto.js
└── tests/
    ├── auth.test.js
    ├── patients.test.js
    └── ...
```

### Example: Refactored Auth Flow

**config/database.js:**
```javascript
import mysql from 'mysql2/promise';

let pool = null;

export const initializePool = async () => {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10
    });
};

export const getPool = () => pool;

export const executeQuery = async (query, params = []) => {
    const connection = await pool.getConnection();
    try {
        const [results] = await connection.execute(query, params);
        return results;
    } finally {
        connection.release();
    }
};

export const executeTransaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
```

**services/authService.js:**
```javascript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { executeQuery, executeTransaction } from '../config/database.js';
import { auditLog } from './auditService.js';

export const registerUser = async (name, email, password, role = 'user') => {
    // Check if user exists
    const existing = await executeQuery(
        'SELECT id FROM users WHERE email = ?',
        [email]
    );

    if (existing.length > 0) {
        throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await executeQuery(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
    );

    await auditLog(result.insertId, 'REGISTER', 'users', result.insertId, { role });

    return result.insertId;
};

export const loginUser = async (email, password) => {
    const users = await executeQuery(
        'SELECT id, name, email, password, role FROM users WHERE email = ?',
        [email]
    );

    if (users.length === 0) {
        throw new Error('Invalid email or password');
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Store refresh token
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await executeQuery(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [user.id, tokenHash, expiresAt]
    );

    await auditLog(user.id, 'LOGIN', 'users', user.id, {});

    return {
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
};

export const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const storedTokens = await executeQuery(
            'SELECT * FROM refresh_tokens WHERE user_id = ? AND token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()',
            [decoded.id, tokenHash]
        );

        if (storedTokens.length === 0) {
            throw new Error('Invalid or revoked refresh token');
        }

        const user = await executeQuery('SELECT * FROM users WHERE id = ?', [decoded.id]);

        const newAccessToken = jwt.sign(
            { id: user[0].id, email: user[0].email, role: user[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return newAccessToken;
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};

export const logoutUser = async (userId) => {
    await executeQuery(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
        [userId]
    );

    await auditLog(userId, 'LOGOUT', 'users', userId, {});
};
```

**controllers/authController.js:**
```javascript
import { registerUser, loginUser, refreshAccessToken, logoutUser } from '../services/authService.js';
import { logger } from '../config/logger.js';

export const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const userId = await registerUser(name, email, password, role);

        res.status(201).json({
            message: 'User registered successfully',
            userId
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);

        res.json({
            message: 'Login successful',
            ...result
        });
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const accessToken = await refreshAccessToken(refreshToken);

        res.json({ accessToken });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        await logoutUser(req.user.id);

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};
```

**routes/auth.js:**
```javascript
import express from 'express';
import { register, login, refresh, logout } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';
import { handleValidationErrors } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, validateRegister, handleValidationErrors, register);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);
router.post('/refresh', refresh);
router.post('/logout', authenticateToken, logout);

export default router;
```

**server.js (CLEAN):**
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializePool } from './config/database.js';
import { logger } from './config/logger.js';
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize database
await initializePool();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);

// Error handler (LAST)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
```

---

## Gap 7: No File Upload System 📁 MISSING FEATURE

### Current State (MISSING)

```javascript
// v3.0 has NO file upload capability
// Hospital systems NEED:
// - Patient documents (medical history, lab reports)
// - X-rays and medical images
// - Prescriptions
// - Insurance documents
```

### Production Solution

**1. Install dependencies:**
```bash
npm install multer aws-sdk dotenv
```

**2. Create file upload service:**
```javascript
// services/fileService.js
import multer from 'multer';
import AWS from 'aws-sdk';
import path from 'path';
import crypto from 'crypto';

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
});

// Configure multer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

export const uploadToS3 = async (file, folder) => {
    const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${file.originalname}`;

    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private'
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
};

export const getFileUrl = async (key) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Expires: 3600 // 1 hour
    };

    return s3.getSignedUrl('getObject', params);
};

export const deleteFile = async (key) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
    };

    return new Promise((resolve, reject) => {
        s3.deleteObject(params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
};
```

**3. Create patient_files table:**
```sql
CREATE TABLE patient_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    uploaded_by INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_key VARCHAR(255) NOT NULL UNIQUE,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_created_at (created_at)
);
```

**4. Create file upload controller:**
```javascript
// controllers/fileController.js
import { uploadToS3, getFileUrl, deleteFile } from '../services/fileService.js';
import { executeQuery } from '../config/database.js';
import { auditLog } from '../services/auditService.js';

export const uploadPatientFile = async (req, res, next) => {
    try {
        const { patientId, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Upload to S3
        const s3Data = await uploadToS3(req.file, `patients/${patientId}`);

        // Store file metadata in database
        const result = await executeQuery(
            'INSERT INTO patient_files (patient_id, uploaded_by, file_name, file_key, file_type, file_size, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [patientId, req.user.id, req.file.originalname, s3Data.Key, req.file.mimetype, req.file.size, description]
        );

        await auditLog(req.user.id, 'UPLOAD_FILE', 'patient_files', result.insertId, {
            patientId,
            fileName: req.file.originalname
        });

        res.status(201).json({
            message: 'File uploaded successfully',
            fileId: result.insertId,
            fileName: req.file.originalname
        });
    } catch (error) {
        next(error);
    }
};

export const getPatientFiles = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const files = await executeQuery(
            'SELECT id, file_name, file_type, file_size, description, created_at FROM patient_files WHERE patient_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [patientId, limit, offset]
        );

        const countResult = await executeQuery(
            'SELECT COUNT(*) as total FROM patient_files WHERE patient_id = ?',
            [patientId]
        );

        res.json({
            data: files,
            pagination: {
                page,
                limit,
                total: countResult[0].total
            }
        });
    } catch (error) {
        next(error);
    }
};

export const downloadPatientFile = async (req, res, next) => {
    try {
        const { fileId } = req.params;

        const files = await executeQuery(
            'SELECT file_key FROM patient_files WHERE id = ?',
            [fileId]
        );

        if (files.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const url = await getFileUrl(files[0].file_key);

        res.json({ downloadUrl: url });
    } catch (error) {
        next(error);
    }
};

export const deletePatientFile = async (req, res, next) => {
    try {
        const { fileId } = req.params;

        const files = await executeQuery(
            'SELECT file_key FROM patient_files WHERE id = ?',
            [fileId]
        );

        if (files.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete from S3
        await deleteFile(files[0].file_key);

        // Delete from database
        await executeQuery('DELETE FROM patient_files WHERE id = ?', [fileId]);

        await auditLog(req.user.id, 'DELETE_FILE', 'patient_files', fileId, {});

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        next(error);
    }
};
```

**5. Create file routes:**
```javascript
// routes/files.js
import express from 'express';
import { upload } from '../services/fileService.js';
import { uploadPatientFile, getPatientFiles, downloadPatientFile, deletePatientFile } from '../controllers/fileController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/patients/:patientId/upload', 
    authenticateToken, 
    authorize('admin', 'staff', 'doctor'), 
    upload.single('file'), 
    uploadPatientFile
);

router.get('/patients/:patientId/files', 
    authenticateToken, 
    authorize('admin', 'staff', 'doctor'), 
    getPatientFiles
);

router.get('/files/:fileId/download', 
    authenticateToken, 
    downloadPatientFile
);

router.delete('/files/:fileId', 
    authenticateToken, 
    authorize('admin', 'staff'), 
    deletePatientFile
);

export default router;
```

---

## Summary: 8 Gaps to Fix

| Gap | Severity | Impact | Effort |
|-----|----------|--------|--------|
| 1. Incomplete Refresh Token | CRITICAL | Security risk | Medium |
| 2. No Real Transactions | CRITICAL | Data corruption | Medium |
| 3. Gender Enum Mismatch | HIGH | Broken feature | Low |
| 4. No XSS Protection | HIGH | Security risk | Low |
| 5. Sensitive Data in Logs | MEDIUM | Privacy risk | Low |
| 6. Monolithic Architecture | MEDIUM | Maintainability | High |
| 7. No File Upload | MEDIUM | Missing feature | High |
| 8. Documentation | LOW | Usability | Medium |

---

## Roadmap: 8.5/10 → 9.5+/10

**Phase 1 (CRITICAL - 2 hours):**
- Fix refresh token system
- Implement real transactions
- Fix gender enum mismatch

**Phase 2 (SECURITY - 1 hour):**
- Add XSS protection
- Mask sensitive logging

**Phase 3 (ARCHITECTURE - 4 hours):**
- Refactor into layered architecture
- Separate concerns

**Phase 4 (FEATURES - 3 hours):**
- Implement file upload system
- Add file management endpoints

**Total Effort:** ~10 hours → 9.5+/10 production-ready

---

**This is the path from good to excellent.** 🚀
