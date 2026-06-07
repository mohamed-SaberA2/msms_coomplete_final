/**
 * File Service - v4.0 Production Ready
 * GAP 7 FIX: Complete file upload system for patient documents
 */

import multer from 'multer';
import crypto from 'crypto';
import { executeQuery } from '../utils/database-v4.js';
import { logger } from '../utils/logger-v4.js';
import { auditLog } from './auditService-v4.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Allowed file types for medical documents
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

/**
 * Store file metadata in database
 * In production, you would upload to S3/cloud storage
 * This version stores metadata for local file handling
 */
export const storeFileMetadata = async (patientId, userId, file, description = '') => {
    try {
        // Generate unique file key
        const fileKey = `patients/${patientId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${file.originalname}`;

        // Store metadata in database
        const result = await executeQuery(
            `INSERT INTO patient_files (
                patient_id, uploaded_by, file_name, file_key, file_type, file_size, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                patientId,
                userId,
                file.originalname,
                fileKey,
                file.mimetype,
                file.size,
                description
            ]
        );

        await auditLog(userId, 'UPLOAD_FILE', 'patient_files', result.insertId, {
            patientId,
            fileName: file.originalname,
            fileSize: file.size
        });

        logger.info(`File uploaded: ${file.originalname} for patient #${patientId}`);

        return {
            fileId: result.insertId,
            fileKey,
            fileName: file.originalname,
            fileSize: file.size
        };
    } catch (error) {
        logger.error('File metadata storage failed:', error);
        throw error;
    }
};

/**
 * Get patient files with pagination
 */
export const getPatientFiles = async (patientId, page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;

        const files = await executeQuery(
            `SELECT id, file_name, file_type, file_size, description, created_at
             FROM patient_files
             WHERE patient_id = ? AND is_deleted = FALSE
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [patientId, limit, offset]
        );

        const countResult = await executeQuery(
            'SELECT COUNT(*) as total FROM patient_files WHERE patient_id = ? AND is_deleted = FALSE',
            [patientId]
        );

        return {
            files,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        };
    } catch (error) {
        logger.error('Failed to fetch patient files:', error);
        throw error;
    }
};

/**
 * Get file by ID
 */
export const getFileById = async (fileId) => {
    try {
        const files = await executeQuery(
            `SELECT id, patient_id, file_name, file_key, file_type, file_size, created_at
             FROM patient_files
             WHERE id = ? AND is_deleted = FALSE`,
            [fileId]
        );

        if (files.length === 0) {
            throw new Error('File not found');
        }

        return files[0];
    } catch (error) {
        logger.error('Failed to fetch file:', error);
        throw error;
    }
};

/**
 * Delete file (soft delete)
 */
export const deleteFile = async (fileId, userId) => {
    try {
        // Get file
        const files = await executeQuery(
            'SELECT id, patient_id FROM patient_files WHERE id = ?',
            [fileId]
        );

        if (files.length === 0) {
            throw new Error('File not found');
        }

        // Soft delete
        await executeQuery(
            'UPDATE patient_files SET is_deleted = TRUE WHERE id = ?',
            [fileId]
        );

        await auditLog(userId, 'DELETE_FILE', 'patient_files', fileId, {
            patientId: files[0].patient_id
        });

        logger.info(`File deleted: ID ${fileId}`);
    } catch (error) {
        logger.error('File deletion failed:', error);
        throw error;
    }
};

/**
 * Get file storage stats
 */
export const getFileStats = async (patientId) => {
    try {
        const stats = await executeQuery(
            `SELECT
                COUNT(*) as total_files,
                SUM(file_size) as total_size,
                COUNT(DISTINCT file_type) as file_types
             FROM patient_files
             WHERE patient_id = ? AND is_deleted = FALSE`,
            [patientId]
        );

        return stats[0];
    } catch (error) {
        logger.error('Failed to fetch file stats:', error);
        throw error;
    }
};

/**
 * Search files by name
 */
export const searchFiles = async (patientId, query, limit = 50) => {
    try {
        const searchQuery = `%${query}%`;

        const files = await executeQuery(
            `SELECT id, file_name, file_type, file_size, created_at
             FROM patient_files
             WHERE patient_id = ? AND file_name LIKE ? AND is_deleted = FALSE
             ORDER BY created_at DESC
             LIMIT ?`,
            [patientId, searchQuery, limit]
        );

        return files;
    } catch (error) {
        logger.error('File search failed:', error);
        throw error;
    }
};

export default {
    upload,
    storeFileMetadata,
    getPatientFiles,
    getFileById,
    deleteFile,
    getFileStats,
    searchFiles
};
