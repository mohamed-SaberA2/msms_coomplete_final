/**
 * Patient Routes - v4.0 Production Ready
 */

import express from 'express';
import * as patientController from '../controllers/patientController-v4.js';
import * as validation from '../middleware/validation-v4.js';
import { authenticateToken, authorize } from '../middleware/auth-v4.js';
import { createLimiter } from '../middleware/rateLimiter-v4.js';

const router = express.Router();

/**
 * Get all patients (with pagination)
 */
router.get(
    '/',
    authenticateToken,
    authorize('admin', 'staff', 'doctor'),
    validation.validatePagination,
    validation.handleValidationErrors,
    patientController.getAllPatients
);

/**
 * Search patients
 */
router.get(
    '/search',
    authenticateToken,
    authorize('admin', 'staff', 'doctor'),
    validation.validateSearch,
    validation.handleValidationErrors,
    patientController.searchPatients
);

/**
 * Get patient statistics
 */
router.get(
    '/stats',
    authenticateToken,
    authorize('admin', 'staff'),
    patientController.getPatientStats
);

/**
 * Get patient by ID
 */
router.get(
    '/:id',
    authenticateToken,
    authorize('admin', 'staff', 'doctor'),
    validation.validateNumericId,
    validation.handleValidationErrors,
    patientController.getPatientById
);

/**
 * Create patient
 */
router.post(
    '/',
    authenticateToken,
    authorize('admin', 'staff'),
    createLimiter,
    validation.validatePatient,
    validation.handleValidationErrors,
    patientController.createPatient
);

/**
 * Update patient
 */
router.put(
    '/:id',
    authenticateToken,
    authorize('admin', 'staff'),
    validation.validateNumericId,
    validation.validatePatient,
    validation.handleValidationErrors,
    patientController.updatePatient
);

/**
 * Delete patient
 */
router.delete(
    '/:id',
    authenticateToken,
    authorize('admin'),
    validation.validateNumericId,
    validation.handleValidationErrors,
    patientController.deletePatient
);

export default router;
