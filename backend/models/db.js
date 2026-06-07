import mysql from 'mysql2/promise.js';
import { config } from '../config.js';

let pool = null;

export async function initializeDatabase() {
  try {
    pool = mysql.createPool(config.database);
    console.log('✓ Database connection pool initialized');
    return pool;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
}

export async function query(sql, values = []) {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
}

export async function getConnection() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return await pool.getConnection();
}

// User queries
export async function getUserByEmail(email) {
  const sql = 'SELECT * FROM users WHERE email = ?';
  const results = await query(sql, [email]);
  return results[0] || null;
}

export async function getUserById(id) {
  const sql = 'SELECT * FROM users WHERE id = ?';
  const results = await query(sql, [id]);
  return results[0] || null;
}

export async function createUser(email, passwordHash, fullName, phone, role) {
  const sql = 'INSERT INTO users (email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?)';
  const result = await query(sql, [email, passwordHash, fullName, phone, role]);
  return result.insertId;
}

// Patient queries
export async function getAllPatients(limit = 10, offset = 0) {
  const sql = 'SELECT * FROM patients LIMIT ? OFFSET ?';
  return await query(sql, [limit, offset]);
}

export async function getPatientById(id) {
  const sql = 'SELECT * FROM patients WHERE id = ?';
  const results = await query(sql, [id]);
  return results[0] || null;
}

export async function createPatient(firstName, lastName, dateOfBirth, gender, phone, email, address, emergencyContact, userId) {
  const sql = 'INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const result = await query(sql, [firstName, lastName, dateOfBirth, gender, phone, email, address, emergencyContact, userId]);
  return result.insertId;
}

export async function updatePatient(id, firstName, lastName, dateOfBirth, gender, phone, email, address, emergencyContact) {
  const sql = 'UPDATE patients SET first_name=?, last_name=?, date_of_birth=?, gender=?, phone=?, email=?, address=?, emergency_contact=? WHERE id=?';
  const result = await query(sql, [firstName, lastName, dateOfBirth, gender, phone, email, address, emergencyContact, id]);
  return result.affectedRows > 0;
}

export async function deletePatient(id) {
  const sql = 'DELETE FROM patients WHERE id = ?';
  const result = await query(sql, [id]);
  return result.affectedRows > 0;
}

export async function searchPatients(searchTerm) {
  const sql = 'SELECT * FROM patients WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?';
  const term = `%${searchTerm}%`;
  return await query(sql, [term, term, term, term]);
}

// Doctor queries
export async function getAllDoctors(limit = 10, offset = 0) {
  const sql = `SELECT d.*, u.full_name, u.email, u.phone FROM doctors d 
               JOIN users u ON d.user_id = u.id LIMIT ? OFFSET ?`;
  return await query(sql, [limit, offset]);
}

export async function getDoctorById(id) {
  const sql = `SELECT d.*, u.full_name, u.email, u.phone FROM doctors d 
               JOIN users u ON d.user_id = u.id WHERE d.id = ?`;
  const results = await query(sql, [id]);
  return results[0] || null;
}

export async function createDoctor(userId, specialization, licenseNumber, officeLocation) {
  const sql = 'INSERT INTO doctors (user_id, specialization, license_number, office_location) VALUES (?, ?, ?, ?)';
  const result = await query(sql, [userId, specialization, licenseNumber, officeLocation]);
  return result.insertId;
}

export async function updateDoctor(id, specialization, licenseNumber, officeLocation, isActive) {
  const sql = 'UPDATE doctors SET specialization=?, license_number=?, office_location=?, is_active=? WHERE id=?';
  const result = await query(sql, [specialization, licenseNumber, officeLocation, isActive, id]);
  return result.affectedRows > 0;
}

export async function getActiveDoctorsCount() {
  const sql = 'SELECT COUNT(*) as count FROM doctors WHERE is_active = TRUE';
  const results = await query(sql);
  return results[0].count;
}

// Appointment queries
export async function getAllAppointments(limit = 10, offset = 0) {
  const sql = `SELECT a.*, p.first_name, p.last_name, d.specialization, u.full_name as doctor_name 
               FROM appointments a 
               JOIN patients p ON a.patient_id = p.id 
               JOIN doctors d ON a.doctor_id = d.id 
               JOIN users u ON d.user_id = u.id 
               LIMIT ? OFFSET ?`;
  return await query(sql, [limit, offset]);
}

export async function getAppointmentById(id) {
  const sql = `SELECT a.*, p.first_name, p.last_name, d.specialization, u.full_name as doctor_name 
               FROM appointments a 
               JOIN patients p ON a.patient_id = p.id 
               JOIN doctors d ON a.doctor_id = d.id 
               JOIN users u ON d.user_id = u.id 
               WHERE a.id = ?`;
  const results = await query(sql, [id]);
  return results[0] || null;
}

export async function createAppointment(patientId, doctorId, appointmentDate, durationMinutes, notes) {
  const sql = 'INSERT INTO appointments (patient_id, doctor_id, appointment_date, duration_minutes, notes) VALUES (?, ?, ?, ?, ?)';
  const result = await query(sql, [patientId, doctorId, appointmentDate, durationMinutes, notes]);
  return result.insertId;
}

export async function updateAppointment(id, appointmentDate, durationMinutes, status, notes) {
  const sql = 'UPDATE appointments SET appointment_date=?, duration_minutes=?, status=?, notes=? WHERE id=?';
  const result = await query(sql, [appointmentDate, durationMinutes, status, notes, id]);
  return result.affectedRows > 0;
}

export async function getTodayAppointmentsCount() {
  const sql = `SELECT COUNT(*) as count FROM appointments 
               WHERE DATE(appointment_date) = CURDATE() AND status != 'cancelled'`;
  const results = await query(sql);
  return results[0].count;
}

// Medical Records queries
export async function getAllRecords(limit = 10, offset = 0) {
  const sql = `SELECT r.*, p.first_name, p.last_name, u.full_name as doctor_name 
               FROM medical_records r 
               JOIN patients p ON r.patient_id = p.id 
               JOIN users u ON r.doctor_id = u.id 
               LIMIT ? OFFSET ?`;
  return await query(sql, [limit, offset]);
}

export async function getRecordById(id) {
  const sql = `SELECT r.*, p.first_name, p.last_name, u.full_name as doctor_name 
               FROM medical_records r 
               JOIN patients p ON r.patient_id = p.id 
               JOIN users u ON r.doctor_id = u.id 
               WHERE r.id = ?`;
  const results = await query(sql, [id]);
  return results[0] || null;
}

export async function createRecord(appointmentId, patientId, doctorId, visitDate, diagnosis, treatment, prescriptions, notes, followUpRequired, followUpDate) {
  const sql = `INSERT INTO medical_records (appointment_id, patient_id, doctor_id, visit_date, diagnosis, treatment, prescriptions, notes, follow_up_required, follow_up_date) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const result = await query(sql, [appointmentId, patientId, doctorId, visitDate, diagnosis, treatment, prescriptions, notes, followUpRequired, followUpDate]);
  return result.insertId;
}

export async function updateRecord(id, diagnosis, treatment, prescriptions, notes, followUpRequired, followUpDate) {
  const sql = `UPDATE medical_records SET diagnosis=?, treatment=?, prescriptions=?, notes=?, follow_up_required=?, follow_up_date=? WHERE id=?`;
  const result = await query(sql, [diagnosis, treatment, prescriptions, notes, followUpRequired, followUpDate, id]);
  return result.affectedRows > 0;
}

// Invoice queries
export async function getAllInvoices(limit = 10, offset = 0) {
  const sql = `SELECT i.*, p.first_name, p.last_name 
               FROM invoices i 
               JOIN patients p ON i.patient_id = p.id 
               LIMIT ? OFFSET ?`;
  return await query(sql, [limit, offset]);
}

export async function getInvoiceById(id) {
  const sql = `SELECT i.*, p.first_name, p.last_name 
               FROM invoices i 
               JOIN patients p ON i.patient_id = p.id 
               WHERE i.id = ?`;
  const results = await query(sql, [id]);
  return results[0] || null;
}

export async function createInvoice(patientId, appointmentId, invoiceNumber, amount, description, dueDate) {
  const sql = `INSERT INTO invoices (patient_id, appointment_id, invoice_number, amount, description, due_date) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  const result = await query(sql, [patientId, appointmentId, invoiceNumber, amount, description, dueDate]);
  return result.insertId;
}

export async function updateInvoiceStatus(id, status, paidDate = null) {
  const sql = 'UPDATE invoices SET status=?, paid_date=? WHERE id=?';
  const result = await query(sql, [status, paidDate, id]);
  return result.affectedRows > 0;
}

export async function getPendingBillsCount() {
  const sql = `SELECT COUNT(*) as count FROM invoices WHERE status IN ('pending', 'unpaid')`;
  const results = await query(sql);
  return results[0].count;
}

export async function getTotalPatientsCount() {
  const sql = 'SELECT COUNT(*) as count FROM patients';
  const results = await query(sql);
  return results[0].count;
}

export default { query, initializeDatabase, getConnection };
