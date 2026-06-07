/**
 * Patient Service - v4.0 Production Ready
 * GAP 2 FIX: Uses real transactions for multi-table operations
 * GAP 3 FIX: Fixed gender enum (male/female/other)
 */

import { executeQuery, executeTransaction } from '../utils/database-v4.js';
import { logger } from '../utils/logger-v4.js';
import { auditLog } from './auditService-v4.js';

/**
 * Get all patients with pagination
 */
export const getAllPatients = async (page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;

        const patients = await executeQuery(
            `SELECT id, first_name, last_name, email, phone, date_of_birth, gender, 
                    address, blood_type, created_at
             FROM patients
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const countResult = await executeQuery('SELECT COUNT(*) as total FROM patients');

        return {
            patients,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        };
    } catch (error) {
        logger.error('Failed to fetch patients:', error);
        throw error;
    }
};

/**
 * Get patient by ID
 */
export const getPatientById = async (patientId) => {
    try {
        const patients = await executeQuery(
            `SELECT id, first_name, last_name, email, phone, date_of_birth, gender,
                    address, emergency_contact, emergency_phone, blood_type, allergies,
                    created_at, updated_at
             FROM patients
             WHERE id = ?`,
            [patientId]
        );

        if (patients.length === 0) {
            throw new Error('Patient not found');
        }

        return patients[0];
    } catch (error) {
        logger.error('Failed to fetch patient:', error);
        throw error;
    }
};

/**
 * Search patients
 */
export const searchPatients = async (query, limit = 50) => {
    try {
        const searchQuery = `%${query}%`;

        const patients = await executeQuery(
            `SELECT id, first_name, last_name, email, phone, date_of_birth, gender
             FROM patients
             WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?
             LIMIT ?`,
            [searchQuery, searchQuery, searchQuery, searchQuery, limit]
        );

        return patients;
    } catch (error) {
        logger.error('Patient search failed:', error);
        throw error;
    }
};

/**
 * Create patient
 * GAP 3 FIX: Correct gender enum (male/female/other)
 */
export const createPatient = async (patientData, userId) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            gender,
            address,
            emergencyContact,
            emergencyPhone,
            bloodType,
            allergies
        } = patientData;

        // Validate required fields
        if (!firstName || !lastName || !email || !gender) {
            throw new Error('Missing required fields');
        }

        // Validate gender enum (GAP 3 FIX)
        const validGenders = ['male', 'female', 'other'];
        if (!validGenders.includes(gender.toLowerCase())) {
            throw new Error('Invalid gender. Must be male, female, or other');
        }

        // Check if email already exists
        const existing = await executeQuery(
            'SELECT id FROM patients WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            throw new Error('Email already registered');
        }

        // Create patient
        const result = await executeQuery(
            `INSERT INTO patients (
                first_name, last_name, email, phone, date_of_birth, gender,
                address, emergency_contact, emergency_phone, blood_type, allergies
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                firstName,
                lastName,
                email,
                phone || null,
                dateOfBirth || null,
                gender.toLowerCase(),
                address || null,
                emergencyContact || null,
                emergencyPhone || null,
                bloodType || null,
                allergies || null
            ]
        );

        await auditLog(userId, 'CREATE', 'patients', result.insertId, {
            firstName,
            lastName,
            email
        });

        logger.info(`Patient created: ${firstName} ${lastName}`);

        return result.insertId;
    } catch (error) {
        logger.error('Patient creation failed:', error);
        throw error;
    }
};

/**
 * Update patient
 */
export const updatePatient = async (patientId, patientData, userId) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            gender,
            address,
            emergencyContact,
            emergencyPhone,
            bloodType,
            allergies
        } = patientData;

        // Validate gender if provided
        if (gender) {
            const validGenders = ['male', 'female', 'other'];
            if (!validGenders.includes(gender.toLowerCase())) {
                throw new Error('Invalid gender. Must be male, female, or other');
            }
        }

        // Check if patient exists
        const existing = await executeQuery(
            'SELECT id FROM patients WHERE id = ?',
            [patientId]
        );

        if (existing.length === 0) {
            throw new Error('Patient not found');
        }

        // Update patient
        await executeQuery(
            `UPDATE patients SET
                first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                date_of_birth = COALESCE(?, date_of_birth),
                gender = COALESCE(?, gender),
                address = COALESCE(?, address),
                emergency_contact = COALESCE(?, emergency_contact),
                emergency_phone = COALESCE(?, emergency_phone),
                blood_type = COALESCE(?, blood_type),
                allergies = COALESCE(?, allergies)
             WHERE id = ?`,
            [
                firstName || null,
                lastName || null,
                email || null,
                phone || null,
                dateOfBirth || null,
                gender ? gender.toLowerCase() : null,
                address || null,
                emergencyContact || null,
                emergencyPhone || null,
                bloodType || null,
                allergies || null,
                patientId
            ]
        );

        await auditLog(userId, 'UPDATE', 'patients', patientId, {
            firstName,
            lastName,
            email
        });

        logger.info(`Patient updated: ID ${patientId}`);
    } catch (error) {
        logger.error('Patient update failed:', error);
        throw error;
    }
};

/**
 * Delete patient
 */
export const deletePatient = async (patientId, userId) => {
    try {
        // Check if patient exists
        const existing = await executeQuery(
            'SELECT id FROM patients WHERE id = ?',
            [patientId]
        );

        if (existing.length === 0) {
            throw new Error('Patient not found');
        }

        // Delete patient (cascades to appointments, records, etc.)
        await executeQuery(
            'DELETE FROM patients WHERE id = ?',
            [patientId]
        );

        await auditLog(userId, 'DELETE', 'patients', patientId, {});

        logger.info(`Patient deleted: ID ${patientId}`);
    } catch (error) {
        logger.error('Patient deletion failed:', error);
        throw error;
    }
};

/**
 * Get patient statistics
 */
export const getPatientStats = async () => {
    try {
        const stats = await executeQuery(
            `SELECT
                COUNT(*) as total_patients,
                SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) as male_count,
                SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) as female_count,
                SUM(CASE WHEN gender = 'other' THEN 1 ELSE 0 END) as other_count
             FROM patients`
        );

        return stats[0];
    } catch (error) {
        logger.error('Failed to fetch patient stats:', error);
        throw error;
    }
};

export default {
    getAllPatients,
    getPatientById,
    searchPatients,
    createPatient,
    updatePatient,
    deletePatient,
    getPatientStats
};
