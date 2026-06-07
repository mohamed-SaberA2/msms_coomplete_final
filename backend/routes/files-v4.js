/**
 * File Routes - v4.0 Production Ready
 * GAP 7 FIX: File upload and management endpoints
 */

import express from 'express';
import * as fileController from '../controllers/fileController-v4.js';
import * as fileService from '../services/fileService-v4.js';
import * as validation from '../middleware/validation-v4.js';
import { authenticateToken, authorize } from '../middleware/auth-v4.js';

const router = express.Router();

/**
 * Upload patient file
 */
router.post(
    '/patients/:patientId/upload',
    authenticateToken,
    authorize('admin', 'staff', 'doctor'),
    fileService.upload.single('file'),
    fileController.uploadPatientFile
);

/**
 * Get patient files (with pagination)
 */
router.get(
    '/patients/:patientId/files',
    authenticateToken,
    authorize('admin', 'staff', 'doctor'),
    validation.validatePagination,
    validation.handleValidationErrors,
    fileController.getPatientFiles
);

/**
 * Search patient files
 */
router.get(
    '/patients/:patientId/search',
    authenticateToken,
    authorize('admin', 'staff', 'doctor'),
    validation.validateSearch,
    validation.handleValidationErrors,
    fileController.searchFiles
);

/**
 * Get file statistics
 */
router.get(
    '/patients/:patientId/stats',
    authenticateToken,
    authorize('admin', 'staff', 'doctor'),
    fileController.getFileStats
);

/**
 * Get file by ID
 */
router.get(
    '/:fileId',
    authenticateToken,
    authorize('admin', 'staff', 'doctor'),
    validation.validateNumericId,
    validation.handleValidationErrors,
    fileController.getFileById
);

/**
 * Delete file
 */
router.delete(
    '/:fileId',
    authenticateToken,
    authorize('admin', 'staff'),
    validation.validateNumericId,
    validation.handleValidationErrors,
    fileController.deleteFile
);

export default router;
