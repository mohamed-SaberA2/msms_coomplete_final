/**
 * Audit Service - v4.0 Production Ready
 */

import { executeQuery } from '../utils/database-v4.js';
import { logger } from '../utils/logger-v4.js';

/**
 * Log audit event
 */
export const auditLog = async (userId, action, resource, resourceId, details = {}) => {
    try {
        await executeQuery(
            `INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, action, resource, resourceId, JSON.stringify(details)]
        );

        logger.debug(`Audit: User #${userId} - ${action} on ${resource} #${resourceId}`);
    } catch (error) {
        logger.error('Audit logging failed:', error);
        // Don't throw - audit logging should not break the main operation
    }
};

/**
 * Get audit logs for a user
 */
export const getUserAuditLogs = async (userId, limit = 50) => {
    try {
        const logs = await executeQuery(
            `SELECT id, action, resource, resource_id, details, created_at
             FROM audit_logs
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ?`,
            [userId, limit]
        );

        return logs;
    } catch (error) {
        logger.error('Failed to fetch user audit logs:', error);
        throw error;
    }
};

/**
 * Get audit logs for a resource
 */
export const getResourceAuditLogs = async (resource, resourceId, limit = 50) => {
    try {
        const logs = await executeQuery(
            `SELECT id, user_id, action, details, created_at
             FROM audit_logs
             WHERE resource = ? AND resource_id = ?
             ORDER BY created_at DESC
             LIMIT ?`,
            [resource, resourceId, limit]
        );

        return logs;
    } catch (error) {
        logger.error('Failed to fetch resource audit logs:', error);
        throw error;
    }
};

/**
 * Get all audit logs (admin only)
 */
export const getAllAuditLogs = async (page = 1, limit = 50) => {
    try {
        const offset = (page - 1) * limit;

        const logs = await executeQuery(
            `SELECT id, user_id, action, resource, resource_id, details, created_at
             FROM audit_logs
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const countResult = await executeQuery('SELECT COUNT(*) as total FROM audit_logs');

        return {
            logs,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        };
    } catch (error) {
        logger.error('Failed to fetch audit logs:', error);
        throw error;
    }
};

/**
 * Get sensitive actions (deletions, updates, etc.)
 */
export const getSensitiveActions = async (limit = 100) => {
    try {
        const logs = await executeQuery(
            `SELECT id, user_id, action, resource, resource_id, details, created_at
             FROM audit_logs
             WHERE action IN ('DELETE', 'UPDATE', 'DEACTIVATE_ACCOUNT')
             ORDER BY created_at DESC
             LIMIT ?`,
            [limit]
        );

        return logs;
    } catch (error) {
        logger.error('Failed to fetch sensitive actions:', error);
        throw error;
    }
};

export default {
    auditLog,
    getUserAuditLogs,
    getResourceAuditLogs,
    getAllAuditLogs,
    getSensitiveActions
};
