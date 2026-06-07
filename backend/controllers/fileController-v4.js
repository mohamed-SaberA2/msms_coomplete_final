/**
 * File Controller - v4.0 Production Ready
 * GAP 7 FIX: Handles file upload and management
 */

import * as fileService from '../services/fileService-v4.js';
import { logger } from '../utils/logger-v4.js';

/**
 * Upload patient file
 */
export const uploadPatientFile = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const { description } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        if (!patientId) {
            return res.status(400).json({ error: 'Patient ID required' });
        }

        const result = await fileService.storeFileMetadata(
            patientId,
            req.user.id,
            req.file,
            description
        );

        res.status(201).json({
            message: 'File uploaded successfully',
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get patient files
 */
export const getPatientFiles = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);

        if (!patientId) {
            return res.status(400).json({ error: 'Patient ID required' });
        }

        const result = await fileService.getPatientFiles(patientId, page, limit);

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Get file by ID
 */
export const getFileById = async (req, res, next) => {
    try {
        const { fileId } = req.params;

        const file = await fileService.getFileById(fileId);

        res.json({ file });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete file
 */
export const deleteFile = async (req, res, next) => {
    try {
        const { fileId } = req.params;

        await fileService.deleteFile(fileId, req.user.id);

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get file statistics
 */
export const getFileStats = async (req, res, next) => {
    try {
        const { patientId } = req.params;

        if (!patientId) {
            return res.status(400).json({ error: 'Patient ID required' });
        }

        const stats = await fileService.getFileStats(patientId);

        res.json({ stats });
    } catch (error) {
        next(error);
    }
};

/**
 * Search files
 */
export const searchFiles = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const { q } = req.query;

        if (!patientId) {
            return res.status(400).json({ error: 'Patient ID required' });
        }

        if (!q) {
            return res.status(400).json({ error: 'Search query required' });
        }

        const files = await fileService.searchFiles(patientId, q);

        res.json({ files });
    } catch (error) {
        next(error);
    }
};

export default {
    uploadPatientFile,
    getPatientFiles,
    getFileById,
    deleteFile,
    getFileStats,
    searchFiles
};
