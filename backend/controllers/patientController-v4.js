/**
 * Patient Controller - v4.0 Production Ready
 * Handles all patient-related requests
 */

import * as patientService from '../services/patientService-v4.js';
import { logger } from '../utils/logger-v4.js';

/**
 * Get all patients
 */
export const getAllPatients = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);

        const result = await patientService.getAllPatients(page, limit);

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Get patient by ID
 */
export const getPatientById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const patient = await patientService.getPatientById(id);

        res.json({ patient });
    } catch (error) {
        next(error);
    }
};

/**
 * Search patients
 */
export const searchPatients = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Search query required' });
        }

        const patients = await patientService.searchPatients(q);

        res.json({ patients });
    } catch (error) {
        next(error);
    }
};

/**
 * Create patient
 */
export const createPatient = async (req, res, next) => {
    try {
        const patientData = req.body;

        const patientId = await patientService.createPatient(patientData, req.user.id);

        res.status(201).json({
            message: 'Patient created successfully',
            patientId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update patient
 */
export const updatePatient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const patientData = req.body;

        await patientService.updatePatient(id, patientData, req.user.id);

        res.json({ message: 'Patient updated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete patient
 */
export const deletePatient = async (req, res, next) => {
    try {
        const { id } = req.params;

        await patientService.deletePatient(id, req.user.id);

        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get patient statistics
 */
export const getPatientStats = async (req, res, next) => {
    try {
        const stats = await patientService.getPatientStats();

        res.json({ stats });
    } catch (error) {
        next(error);
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
