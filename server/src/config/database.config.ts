/**
 * Конфігурація бази даних MySQL
 */

import mysql from 'mysql2/promise';
import { DatabaseConfig } from '../types/base.types';

export const dbConfig: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'weaponry_online_db',
    port: parseInt(process.env.DB_PORT || '3306')
};

// Створення пулу з'єднань для оптимізації
export const createConnectionPool = () => {
    return mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4'
    });
};

// Ініціалізація пулу з'єднань
export const pool = createConnectionPool();

// Тестування з'єднання
export const testConnection = async (): Promise<boolean> => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log('✅ Підключення до MySQL успішне');
        return true;
    } catch (error) {
        console.error('❌ Помилка підключення до MySQL:', error);
        return false;
    }
};

// Закриття пулу з'єднань при завершенні роботи
export const closePool = async (): Promise<void> => {
    await pool.end();
    console.log('🔐 Пул з\'єднань MySQL закрито');
};

// Обробка завершення процесу
process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closePool();
    process.exit(0);
}); 