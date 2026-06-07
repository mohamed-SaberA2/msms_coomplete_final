const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ DATABASE CONNECTION ============
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ============ AUTHENTICATION MIDDLEWARE ============
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ============ AUTHORIZATION MIDDLEWARE ============
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

// ============ ERROR HANDLING ============
const handleError = (res, error, statusCode = 500) => {
    console.error('Error:', error);
    res.status(statusCode).json({ 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
    });
};

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const connection = await pool.getConnection();
        
        // Check if user exists
        const [existingUser] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
            [name, email, hashedPassword, role || 'user']
        );

        connection.release();

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertId
        });
    } catch (error) {
        handleError(res, error);
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const connection = await pool.getConnection();
        
        const [users] = await connection.execute(
            'SELECT id, name, email, password, role FROM users WHERE email = ?',
            [email]
        );

        connection.release();

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        handleError(res, error);
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [users] = await connection.execute(
            'SELECT id, name, email, role FROM users WHERE id = ?',
            [req.user.id]
        );

        connection.release();

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        handleError(res, error);
    }
});

// ============ PATIENT ROUTES ============

// Get all patients
app.get('/api/patients', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [patients] = await connection.execute(
            'SELECT * FROM patients ORDER BY created_at DESC'
        );

        connection.release();
        res.json(patients);
    } catch (error) {
        handleError(res, error);
    }
});

// Get patient by ID
app.get('/api/patients/:id', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [patients] = await connection.execute(
            'SELECT * FROM patients WHERE id = ?',
            [req.params.id]
        );

        connection.release();

        if (patients.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(patients[0]);
    } catch (error) {
        handleError(res, error);
    }
});

// Create patient
app.post('/api/patients', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
    try {
        const { first_name, last_name, email, phone, date_of_birth, gender, address, medical_history } = req.body;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({ error: 'First name, last name, and email are required' });
        }

        const connection = await pool.getConnection();
        
        const [result] = await connection.execute(
            'INSERT INTO patients (first_name, last_name, email, phone, date_of_birth, gender, address, medical_history, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [first_name, last_name, email, phone, date_of_birth, gender, address, medical_history]
        );

        connection.release();

        res.status(201).json({
            message: 'Patient created successfully',
            patientId: result.insertId
        });
    } catch (error) {
        handleError(res, error);
    }
});

// Update patient
app.put('/api/patients/:id', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
    try {
        const { first_name, last_name, email, phone, date_of_birth, gender, address, medical_history } = req.body;

        const connection = await pool.getConnection();
        
        await connection.execute(
            'UPDATE patients SET first_name=?, last_name=?, email=?, phone=?, date_of_birth=?, gender=?, address=?, medical_history=?, updated_at=NOW() WHERE id=?',
            [first_name, last_name, email, phone, date_of_birth, gender, address, medical_history, req.params.id]
        );

        connection.release();

        res.json({ message: 'Patient updated successfully' });
    } catch (error) {
        handleError(res, error);
    }
});

// Delete patient
app.delete('/api/patients/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        await connection.execute('DELETE FROM patients WHERE id = ?', [req.params.id]);

        connection.release();

        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
});

// Search patients
app.get('/api/patients/search/:query', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [patients] = await connection.execute(
            'SELECT * FROM patients WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? ORDER BY created_at DESC',
            [`%${req.params.query}%`, `%${req.params.query}%`, `%${req.params.query}%`]
        );

        connection.release();
        res.json(patients);
    } catch (error) {
        handleError(res, error);
    }
});

// ============ DOCTOR ROUTES ============

// Get all doctors
app.get('/api/doctors', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [doctors] = await connection.execute(
            'SELECT * FROM doctors WHERE is_active = 1 ORDER BY created_at DESC'
        );

        connection.release();
        res.json(doctors);
    } catch (error) {
        handleError(res, error);
    }
});

// Get doctor by ID
app.get('/api/doctors/:id', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [doctors] = await connection.execute(
            'SELECT * FROM doctors WHERE id = ?',
            [req.params.id]
        );

        connection.release();

        if (doctors.length === 0) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        res.json(doctors[0]);
    } catch (error) {
        handleError(res, error);
    }
});

// Create doctor
app.post('/api/doctors', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { first_name, last_name, email, phone, specialization, license_number, office_location } = req.body;

        if (!first_name || !last_name || !email || !specialization) {
            return res.status(400).json({ error: 'First name, last name, email, and specialization are required' });
        }

        const connection = await pool.getConnection();
        
        const [result] = await connection.execute(
            'INSERT INTO doctors (first_name, last_name, email, phone, specialization, license_number, office_location, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())',
            [first_name, last_name, email, phone, specialization, license_number, office_location]
        );

        connection.release();

        res.status(201).json({
            message: 'Doctor created successfully',
            doctorId: result.insertId
        });
    } catch (error) {
        handleError(res, error);
    }
});

// Update doctor
app.put('/api/doctors/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { first_name, last_name, email, phone, specialization, license_number, office_location, is_active } = req.body;

        const connection = await pool.getConnection();
        
        await connection.execute(
            'UPDATE doctors SET first_name=?, last_name=?, email=?, phone=?, specialization=?, license_number=?, office_location=?, is_active=?, updated_at=NOW() WHERE id=?',
            [first_name, last_name, email, phone, specialization, license_number, office_location, is_active, req.params.id]
        );

        connection.release();

        res.json({ message: 'Doctor updated successfully' });
    } catch (error) {
        handleError(res, error);
    }
});

// ============ APPOINTMENT ROUTES ============

// Get all appointments
app.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [appointments] = await connection.execute(
            'SELECT a.*, p.first_name as patient_name, d.first_name as doctor_name FROM appointments a LEFT JOIN patients p ON a.patient_id = p.id LEFT JOIN doctors d ON a.doctor_id = d.id ORDER BY a.appointment_date DESC'
        );

        connection.release();
        res.json(appointments);
    } catch (error) {
        handleError(res, error);
    }
});

// Create appointment
app.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const { patient_id, doctor_id, appointment_date, appointment_time, reason, status } = req.body;

        if (!patient_id || !doctor_id || !appointment_date) {
            return res.status(400).json({ error: 'Patient ID, doctor ID, and appointment date are required' });
        }

        const connection = await pool.getConnection();
        
        const [result] = await connection.execute(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [patient_id, doctor_id, appointment_date, appointment_time, reason, status || 'scheduled']
        );

        connection.release();

        res.status(201).json({
            message: 'Appointment created successfully',
            appointmentId: result.insertId
        });
    } catch (error) {
        handleError(res, error);
    }
});

// Update appointment
app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const { patient_id, doctor_id, appointment_date, appointment_time, reason, status } = req.body;

        const connection = await pool.getConnection();
        
        await connection.execute(
            'UPDATE appointments SET patient_id=?, doctor_id=?, appointment_date=?, appointment_time=?, reason=?, status=?, updated_at=NOW() WHERE id=?',
            [patient_id, doctor_id, appointment_date, appointment_time, reason, status, req.params.id]
        );

        connection.release();

        res.json({ message: 'Appointment updated successfully' });
    } catch (error) {
        handleError(res, error);
    }
});

// ============ MEDICAL RECORDS ROUTES ============

// Get all records
app.get('/api/records', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [records] = await connection.execute(
            'SELECT r.*, p.first_name as patient_name, d.first_name as doctor_name FROM medical_records r LEFT JOIN patients p ON r.patient_id = p.id LEFT JOIN doctors d ON r.doctor_id = d.id ORDER BY r.visit_date DESC'
        );

        connection.release();
        res.json(records);
    } catch (error) {
        handleError(res, error);
    }
});

// Create medical record
app.post('/api/records', authenticateToken, authorize('admin', 'doctor'), async (req, res) => {
    try {
        const { patient_id, doctor_id, visit_date, diagnosis, treatment, prescriptions, notes } = req.body;

        if (!patient_id || !doctor_id || !visit_date) {
            return res.status(400).json({ error: 'Patient ID, doctor ID, and visit date are required' });
        }

        const connection = await pool.getConnection();
        
        const [result] = await connection.execute(
            'INSERT INTO medical_records (patient_id, doctor_id, visit_date, diagnosis, treatment, prescriptions, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [patient_id, doctor_id, visit_date, diagnosis, treatment, prescriptions, notes]
        );

        connection.release();

        res.status(201).json({
            message: 'Medical record created successfully',
            recordId: result.insertId
        });
    } catch (error) {
        handleError(res, error);
    }
});

// ============ BILLING ROUTES ============

// Get all invoices
app.get('/api/billing', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [invoices] = await connection.execute(
            'SELECT i.*, p.first_name as patient_name FROM invoices i LEFT JOIN patients p ON i.patient_id = p.id ORDER BY i.created_at DESC'
        );

        connection.release();
        res.json(invoices);
    } catch (error) {
        handleError(res, error);
    }
});

// Create invoice
app.post('/api/billing', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
    try {
        const { patient_id, amount, description, due_date, payment_status } = req.body;

        if (!patient_id || !amount) {
            return res.status(400).json({ error: 'Patient ID and amount are required' });
        }

        const connection = await pool.getConnection();
        
        const [result] = await connection.execute(
            'INSERT INTO invoices (patient_id, amount, description, due_date, payment_status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [patient_id, amount, description, due_date, payment_status || 'pending']
        );

        connection.release();

        res.status(201).json({
            message: 'Invoice created successfully',
            invoiceId: result.insertId
        });
    } catch (error) {
        handleError(res, error);
    }
});

// Update invoice status
app.put('/api/billing/:id', authenticateToken, authorize('admin', 'staff'), async (req, res) => {
    try {
        const { payment_status, payment_date } = req.body;

        const connection = await pool.getConnection();
        
        await connection.execute(
            'UPDATE invoices SET payment_status=?, payment_date=?, updated_at=NOW() WHERE id=?',
            [payment_status, payment_date, req.params.id]
        );

        connection.release();

        res.json({ message: 'Invoice updated successfully' });
    } catch (error) {
        handleError(res, error);
    }
});

// ============ DASHBOARD ROUTES ============

// Get recent activity
app.get('/api/dashboard/activity', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const connection = await pool.getConnection();
        // FIX: MySQL2 doesn't handle LIMIT ? well with UNION ALL
        // Solution: Use subquery without parameter in LIMIT
        const [activities] = await connection.execute(`
            SELECT 
                'appointment' as type, 
                appointment_date as date, 
                reason as description 
            FROM appointments 
            UNION ALL 
            SELECT 
                'invoice' as type, 
                created_at as date, 
                description 
            FROM invoices 
            ORDER BY date DESC 
            LIMIT ` + limit);
        connection.release();
        res.json(activities);
    } catch (error) {
        handleError(res, error);
    }
});

// Get dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();

        // Total patients
        const [patientCount] = await connection.execute('SELECT COUNT(*) as count FROM patients');

        // Today's appointments
        const [todayAppointments] = await connection.execute(
            'SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = CURDATE()'
        );

        // Pending bills
        const [pendingBills] = await connection.execute(
            'SELECT COUNT(*) as count FROM invoices WHERE payment_status = "pending"'
        );

        // Active doctors
        const [activeDoctors] = await connection.execute(
            'SELECT COUNT(*) as count FROM doctors WHERE is_active = 1'
        );

        connection.release();

        res.json({
            totalPatients: patientCount[0].count,
            todayAppointments: todayAppointments[0].count,
            pendingBills: pendingBills[0].count,
            activeDoctors: activeDoctors[0].count
        });
    } catch (error) {
        handleError(res, error);
    }
});

// ============ AUTHENTICATION ROUTES (CONTINUED) ============

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    try {
        // In JWT, logout is handled on the frontend by removing the token
        // This endpoint just confirms the logout action
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        handleError(res, error);
    }
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log('Hospital Management System - Backend Server');
    console.log(`${'='.repeat(50)}`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DB_NAME || 'hospital_management'}`);
    console.log(`${'='.repeat(50)}\n`);
});

module.exports = app;
