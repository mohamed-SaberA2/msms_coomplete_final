import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initializePool, executeQuery, executeTransaction } from './utils/database.js';
import { authenticateToken, authorize } from './middleware/auth.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, createLimiter } from './middleware/rateLimiter.js';
import { 
    validateLogin, 
    validateRegister, 
    validatePatient,
    validateDoctor,
    validateAppointment,
    validateSearch 
} from './middleware/validation.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE SETUP ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.post('/api/patients', createLimiter);
app.post('/api/doctors', createLimiter);
app.post('/api/appointments', createLimiter);

// Initialize database pool
try {
    initializePool();
    console.log('✓ Database pool initialized');
} catch (error) {
    console.error('✗ Failed to initialize database pool:', error);
    process.exit(1);
}

// Validate JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error('✗ JWT_SECRET is not configured in .env file');
    process.exit(1);
}

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', validateRegister, asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUsers = await executeQuery(
        'SELECT id FROM users WHERE email = ?',
        [email]
    );

    if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await executeQuery(
        'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
        [name, email, hashedPassword, role || 'user']
    );

    res.status(201).json({
        message: 'User registered successfully',
        userId: result.insertId
    });
}));

// Login
app.post('/api/auth/login', validateLogin, asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const users = await executeQuery(
        'SELECT id, name, email, password, role FROM users WHERE email = ?',
        [email]
    );

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
        process.env.JWT_SECRET,
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
}));

// Get current user
app.get('/api/auth/me', authenticateToken, asyncHandler(async (req, res) => {
    const users = await executeQuery(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [req.user.id]
    );

    if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
}));

// Logout
app.post('/api/auth/logout', authenticateToken, asyncHandler(async (req, res) => {
    // Token is invalidated on frontend by removing it from localStorage
    res.json({ message: 'Logout successful' });
}));

// ============ PATIENT ROUTES ============

// Get all patients
app.get('/api/patients', authenticateToken, authorize('admin', 'staff'), asyncHandler(async (req, res) => {
    const patients = await executeQuery(
        'SELECT * FROM patients ORDER BY created_at DESC'
    );
    res.json(patients);
}));

// Get patient by ID
app.get('/api/patients/:id', authenticateToken, asyncHandler(async (req, res) => {
    const patients = await executeQuery(
        'SELECT * FROM patients WHERE id = ?',
        [req.params.id]
    );

    if (patients.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patients[0]);
}));

// Create patient
app.post('/api/patients', authenticateToken, authorize('admin', 'staff'), validatePatient, asyncHandler(async (req, res) => {
    const { first_name, last_name, email, phone, date_of_birth, gender, address, medical_history } = req.body;

    const result = await executeQuery(
        'INSERT INTO patients (first_name, last_name, email, phone, date_of_birth, gender, address, medical_history, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [first_name, last_name, email, phone, date_of_birth, gender, address, medical_history]
    );

    res.status(201).json({
        message: 'Patient created successfully',
        patientId: result.insertId
    });
}));

// Update patient
app.put('/api/patients/:id', authenticateToken, authorize('admin', 'staff'), validatePatient, asyncHandler(async (req, res) => {
    const { first_name, last_name, email, phone, date_of_birth, gender, address, medical_history } = req.body;

    await executeQuery(
        'UPDATE patients SET first_name=?, last_name=?, email=?, phone=?, date_of_birth=?, gender=?, address=?, medical_history=?, updated_at=NOW() WHERE id=?',
        [first_name, last_name, email, phone, date_of_birth, gender, address, medical_history, req.params.id]
    );

    res.json({ message: 'Patient updated successfully' });
}));

// Delete patient
app.delete('/api/patients/:id', authenticateToken, authorize('admin'), asyncHandler(async (req, res) => {
    await executeQuery('DELETE FROM patients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Patient deleted successfully' });
}));

// Search patients
app.get('/api/patients/search/:query', authenticateToken, authorize('admin', 'staff'), validateSearch, asyncHandler(async (req, res) => {
    const searchTerm = `%${req.params.query}%`;
    const patients = await executeQuery(
        'SELECT * FROM patients WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? ORDER BY created_at DESC',
        [searchTerm, searchTerm, searchTerm]
    );
    res.json(patients);
}));

// ============ DOCTOR ROUTES ============

// Get all doctors
app.get('/api/doctors', authenticateToken, asyncHandler(async (req, res) => {
    const doctors = await executeQuery(
        'SELECT * FROM doctors WHERE is_active = 1 ORDER BY created_at DESC'
    );
    res.json(doctors);
}));

// Get doctor by ID
app.get('/api/doctors/:id', authenticateToken, asyncHandler(async (req, res) => {
    const doctors = await executeQuery(
        'SELECT * FROM doctors WHERE id = ?',
        [req.params.id]
    );

    if (doctors.length === 0) {
        return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json(doctors[0]);
}));

// Create doctor
app.post('/api/doctors', authenticateToken, authorize('admin'), validateDoctor, asyncHandler(async (req, res) => {
    const { name, email, phone, specialization, license_number, availability } = req.body;

    const result = await executeQuery(
        'INSERT INTO doctors (name, email, phone, specialization, license_number, availability, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())',
        [name, email, phone, specialization, license_number, availability]
    );

    res.status(201).json({
        message: 'Doctor created successfully',
        doctorId: result.insertId
    });
}));

// Update doctor
app.put('/api/doctors/:id', authenticateToken, authorize('admin'), validateDoctor, asyncHandler(async (req, res) => {
    const { name, email, phone, specialization, license_number, availability } = req.body;

    await executeQuery(
        'UPDATE doctors SET name=?, email=?, phone=?, specialization=?, license_number=?, availability=?, updated_at=NOW() WHERE id=?',
        [name, email, phone, specialization, license_number, availability, req.params.id]
    );

    res.json({ message: 'Doctor updated successfully' });
}));

// Delete doctor
app.delete('/api/doctors/:id', authenticateToken, authorize('admin'), asyncHandler(async (req, res) => {
    await executeQuery('UPDATE doctors SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Doctor deleted successfully' });
}));

// ============ APPOINTMENT ROUTES ============

// Get all appointments
app.get('/api/appointments', authenticateToken, asyncHandler(async (req, res) => {
    const appointments = await executeQuery(
        'SELECT * FROM appointments ORDER BY appointment_date DESC'
    );
    res.json(appointments);
}));

// Get appointment by ID
app.get('/api/appointments/:id', authenticateToken, asyncHandler(async (req, res) => {
    const appointments = await executeQuery(
        'SELECT * FROM appointments WHERE id = ?',
        [req.params.id]
    );

    if (appointments.length === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointments[0]);
}));

// Create appointment
app.post('/api/appointments', authenticateToken, validateAppointment, asyncHandler(async (req, res) => {
    const { patient_id, doctor_id, appointment_date, appointment_time, reason, status } = req.body;

    const result = await executeQuery(
        'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [patient_id, doctor_id, appointment_date, appointment_time, reason, status || 'scheduled']
    );

    res.status(201).json({
        message: 'Appointment created successfully',
        appointmentId: result.insertId
    });
}));

// Update appointment
app.put('/api/appointments/:id', authenticateToken, asyncHandler(async (req, res) => {
    const { patient_id, doctor_id, appointment_date, appointment_time, reason, status } = req.body;

    await executeQuery(
        'UPDATE appointments SET patient_id=?, doctor_id=?, appointment_date=?, appointment_time=?, reason=?, status=?, updated_at=NOW() WHERE id=?',
        [patient_id, doctor_id, appointment_date, appointment_time, reason, status, req.params.id]
    );

    res.json({ message: 'Appointment updated successfully' });
}));

// Cancel appointment
app.delete('/api/appointments/:id', authenticateToken, asyncHandler(async (req, res) => {
    await executeQuery(
        'UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?',
        ['cancelled', req.params.id]
    );
    res.json({ message: 'Appointment cancelled successfully' });
}));

// ============ MEDICAL RECORDS ROUTES ============

// Get all records
app.get('/api/records', authenticateToken, asyncHandler(async (req, res) => {
    const records = await executeQuery(
        'SELECT * FROM medical_records ORDER BY visit_date DESC'
    );
    res.json(records);
}));

// Get records by patient
app.get('/api/records/patient/:patientId', authenticateToken, asyncHandler(async (req, res) => {
    const records = await executeQuery(
        'SELECT * FROM medical_records WHERE patient_id = ? ORDER BY visit_date DESC',
        [req.params.patientId]
    );
    res.json(records);
}));

// Create record
app.post('/api/records', authenticateToken, authorize('admin', 'doctor'), asyncHandler(async (req, res) => {
    const { patient_id, doctor_id, visit_date, diagnosis, prescription, notes } = req.body;

    const result = await executeQuery(
        'INSERT INTO medical_records (patient_id, doctor_id, visit_date, diagnosis, prescription, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [patient_id, doctor_id, visit_date, diagnosis, prescription, notes]
    );

    res.status(201).json({
        message: 'Medical record created successfully',
        recordId: result.insertId
    });
}));

// ============ BILLING ROUTES ============

// Get all invoices
app.get('/api/billing', authenticateToken, asyncHandler(async (req, res) => {
    const invoices = await executeQuery(
        'SELECT * FROM invoices ORDER BY created_at DESC'
    );
    res.json(invoices);
}));

// Get invoice by ID
app.get('/api/billing/:id', authenticateToken, asyncHandler(async (req, res) => {
    const invoices = await executeQuery(
        'SELECT * FROM invoices WHERE id = ?',
        [req.params.id]
    );

    if (invoices.length === 0) {
        return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoices[0]);
}));

// Create invoice
app.post('/api/billing', authenticateToken, authorize('admin', 'staff'), asyncHandler(async (req, res) => {
    const { patient_id, amount, description, payment_status } = req.body;

    const result = await executeQuery(
        'INSERT INTO invoices (patient_id, amount, description, payment_status, created_at) VALUES (?, ?, ?, ?, NOW())',
        [patient_id, amount, description, payment_status || 'pending']
    );

    res.status(201).json({
        message: 'Invoice created successfully',
        invoiceId: result.insertId
    });
}));

// Update invoice payment status
app.put('/api/billing/:id', authenticateToken, authorize('admin', 'staff'), asyncHandler(async (req, res) => {
    const { payment_status } = req.body;

    await executeQuery(
        'UPDATE invoices SET payment_status = ?, updated_at = NOW() WHERE id = ?',
        [payment_status, req.params.id]
    );

    res.json({ message: 'Invoice updated successfully' });
}));

// ============ DASHBOARD ROUTES ============

// Get dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, asyncHandler(async (req, res) => {
    const totalPatients = await executeQuery('SELECT COUNT(*) as count FROM patients');
    const todayAppointments = await executeQuery(
        'SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = CURDATE()'
    );
    const pendingBills = await executeQuery(
        'SELECT COUNT(*) as count FROM invoices WHERE payment_status = "pending"'
    );
    const availableDoctors = await executeQuery(
        'SELECT COUNT(*) as count FROM doctors WHERE is_active = 1'
    );

    res.json({
        totalPatients: totalPatients[0]?.count || 0,
        todayAppointments: todayAppointments[0]?.count || 0,
        pendingBills: pendingBills[0]?.count || 0,
        availableDoctors: availableDoctors[0]?.count || 0
    });
}));

// Get recent activity
app.get('/api/dashboard/activity', authenticateToken, asyncHandler(async (req, res) => {
    const limit = req.query.limit || 10;

    const activities = await executeQuery(`
        SELECT 
            'appointment' as type,
            CONCAT('Appointment scheduled for ', p.first_name, ' ', p.last_name) as description,
            a.created_at as timestamp
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        UNION ALL
        SELECT 
            'invoice' as type,
            CONCAT('Invoice created for $', i.amount) as description,
            i.created_at as timestamp
        FROM invoices i
        ORDER BY timestamp DESC
        LIMIT ?
    `, [parseInt(limit)]);

    res.json(activities);
}));

// ============ ERROR HANDLING ============
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ============ SERVER STARTUP ============
app.listen(PORT, () => {
    console.log(`
==================================================
Hospital Management System - Backend Server
==================================================
✓ Server running on http://localhost:${PORT}
✓ Environment: ${process.env.NODE_ENV || 'development'}
✓ Database: ${process.env.DB_NAME || 'hospital_management'}
✓ Rate limiting: ${process.env.NODE_ENV === 'development' ? 'DISABLED' : 'ENABLED'}
==================================================
    `);
});

export default app;
