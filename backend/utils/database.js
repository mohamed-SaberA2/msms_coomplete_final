import mysql from 'mysql2/promise';

// ============ DATABASE CONNECTION POOL ============

let pool = null;

export const initializePool = () => {
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

    console.log('Database pool initialized');
    return pool;
};

export const getPool = () => {
    if (!pool) {
        throw new Error('Database pool not initialized. Call initializePool() first.');
    }
    return pool;
};

// ============ SAFE DATABASE QUERY WRAPPER ============

export const executeQuery = async (query, params = []) => {
    let connection = null;
    try {
        connection = await getPool().getConnection();
        const [results] = await connection.execute(query, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ============ SAFE TRANSACTION WRAPPER ============

export const executeTransaction = async (callback) => {
    let connection = null;
    try {
        connection = await getPool().getConnection();
        await connection.beginTransaction();
        
        const result = await callback(connection);
        
        await connection.commit();
        return result;
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Transaction error:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export default {
    initializePool,
    getPool,
    executeQuery,
    executeTransaction
};
