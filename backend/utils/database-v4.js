/**
 * Database Utility - v4.0 Production Ready
 * Implements real transactions with BEGIN/COMMIT/ROLLBACK
 */

import mysql from 'mysql2/promise';
import { logger } from './logger-v4.js';

let pool = null;

/**
 * Initialize database connection pool
 */
export const initializePool = async () => {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hospital_management',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelayMs: 0
        });

        // Test connection
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        
        logger.info('✓ Database pool initialized successfully');
        return pool;
    } catch (error) {
        logger.error('✗ Database initialization failed:', error);
        throw error;
    }
};

/**
 * Get database pool
 */
export const getPool = () => {
    if (!pool) {
        throw new Error('Database pool not initialized');
    }
    return pool;
};

/**
 * Execute a single query
 * @param {string} query - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<array>} Query results
 */
export const executeQuery = async (query, params = []) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        const [results] = await connection.execute(query, params);
        return results;
    } catch (error) {
        logger.error('Database query error:', error.message);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Execute a transaction with BEGIN/COMMIT/ROLLBACK
 * GAP 2 FIX: Real transaction implementation
 * @param {function} callback - Async function that receives connection
 * @returns {Promise} Transaction result
 */
export const executeTransaction = async (callback) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        
        // START TRANSACTION
        await connection.beginTransaction();
        logger.debug('Transaction started');
        
        // Execute callback with connection
        const result = await callback(connection);
        
        // COMMIT all changes
        await connection.commit();
        logger.debug('Transaction committed successfully');
        
        return result;
    } catch (error) {
        if (connection) {
            try {
                // ROLLBACK on error
                await connection.rollback();
                logger.warn('Transaction rolled back due to error:', error.message);
            } catch (rollbackError) {
                logger.error('Rollback failed:', rollbackError.message);
            }
        }
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Execute multiple queries in a transaction
 * @param {array} queries - Array of {query, params}
 * @returns {Promise<array>} Array of results
 */
export const executeMultipleQueries = async (queries) => {
    return executeTransaction(async (connection) => {
        const results = [];
        
        for (const {query, params} of queries) {
            const [result] = await connection.execute(query, params);
            results.push(result);
        }
        
        return results;
    });
};

/**
 * Close database pool
 */
export const closePool = async () => {
    if (pool) {
        await pool.end();
        logger.info('Database pool closed');
    }
};

/**
 * Health check
 */
export const healthCheck = async () => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        return { status: 'healthy' };
    } catch (error) {
        logger.error('Health check failed:', error);
        return { status: 'unhealthy', error: error.message };
    }
};

export default {
    initializePool,
    getPool,
    executeQuery,
    executeTransaction,
    executeMultipleQueries,
    closePool,
    healthCheck
};
