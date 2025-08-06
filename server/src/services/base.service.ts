/**
 * Базовий сервіс для CRUD операцій
 * Реалізує принципи DRY, KISS та SOLID
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/database.config';
import { BaseEntity, PaginationParams, PaginatedResponse, ApiResponse } from '../types/base.types';

export abstract class BaseService<T extends BaseEntity> {
    protected tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    /**
     * Отримати всі записи з пагінацією
     */
    async findAll(params: PaginationParams = {}): Promise<PaginatedResponse<T>> {
        const {
            page = 1,
            limit = 20,
            sortBy = 'id',
            sortOrder = 'DESC'
        } = params;

        const offset = (page - 1) * limit;

        try {
            // Підрахунок загальної кількості записів
            const [countResult] = await pool.execute(
                `SELECT COUNT(*) as total FROM ${this.tableName}`
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Отримання записів з пагінацією
            const [rows] = await pool.execute(
                `SELECT * FROM ${this.tableName} ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`
            ) as [RowDataPacket[], any];

            return {
                items: rows as T[],
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error(`Помилка при отриманні записів з ${this.tableName}:`, error);
            throw new Error(`Не вдалося отримати записи з ${this.tableName}`);
        }
    }

    /**
     * Отримати запис за ID
     */
    async findById(id: number): Promise<T | null> {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM ${this.tableName} WHERE id = ?`,
                [id]
            ) as [RowDataPacket[], any];

            return rows.length > 0 ? rows[0] as T : null;
        } catch (error) {
            console.error(`Помилка при отриманні запису з ${this.tableName} по ID ${id}:`, error);
            throw new Error(`Не вдалося отримати запис по ID ${id}`);
        }
    }

    /**
     * Створити новий запис
     */
    async create(data: Omit<T, 'id'>): Promise<T> {
        const fields = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);

        try {
            const [result] = await pool.execute(
                `INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`,
                values
            ) as [ResultSetHeader, any];

            const createdRecord = await this.findById(result.insertId);
            if (!createdRecord) {
                throw new Error('Створений запис не знайдено');
            }

            return createdRecord;
        } catch (error) {
            console.error(`Помилка при створенні запису в ${this.tableName}:`, error);
            throw new Error(`Не вдалося створити запис в ${this.tableName}`);
        }
    }

    /**
     * Оновити запис
     */
    async update(id: number, data: Partial<Omit<T, 'id'>>): Promise<T | null> {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id];

        try {
            const [result] = await pool.execute(
                `UPDATE ${this.tableName} SET ${fields} WHERE id = ?`,
                values
            ) as [ResultSetHeader, any];

            if (result.affectedRows === 0) {
                return null;
            }

            return await this.findById(id);
        } catch (error) {
            console.error(`Помилка при оновленні запису в ${this.tableName} з ID ${id}:`, error);
            throw new Error(`Не вдалося оновити запис з ID ${id}`);
        }
    }

    /**
     * Видалити запис
     */
    async delete(id: number): Promise<boolean> {
        try {
            const [result] = await pool.execute(
                `DELETE FROM ${this.tableName} WHERE id = ?`,
                [id]
            ) as [ResultSetHeader, any];

            return result.affectedRows > 0;
        } catch (error) {
            console.error(`Помилка при видаленні запису з ${this.tableName} з ID ${id}:`, error);
            throw new Error(`Не вдалося видалити запис з ID ${id}`);
        }
    }

    /**
     * Перевірити чи існує запис
     */
    async exists(id: number): Promise<boolean> {
        try {
            const [rows] = await pool.execute(
                `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`,
                [id]
            ) as [RowDataPacket[], any];

            return rows.length > 0;
        } catch (error) {
            console.error(`Помилка при перевірці існування запису в ${this.tableName} з ID ${id}:`, error);
            return false;
        }
    }

    /**
     * Пошук записів за текстом (для довідкових таблиць)
     */
    async search(searchTerm: string, fields: string[] = ['ukr', 'eng', 'rus']): Promise<T[]> {
        const conditions = fields.map(field => `${field} LIKE ?`).join(' OR ');
        const values = fields.map(() => `%${searchTerm}%`);

        try {
            const [rows] = await pool.execute(
                `SELECT * FROM ${this.tableName} WHERE ${conditions} ORDER BY id`,
                values
            ) as [RowDataPacket[], any];

            return rows as T[];
        } catch (error) {
            console.error(`Помилка при пошуку в ${this.tableName}:`, error);
            throw new Error(`Не вдалося виконати пошук в ${this.tableName}`);
        }
    }

    /**
     * Отримати кількість записів
     */
    async count(): Promise<number> {
        try {
            const [rows] = await pool.execute(
                `SELECT COUNT(*) as count FROM ${this.tableName}`
            ) as [RowDataPacket[], any];

            return rows[0].count;
        } catch (error) {
            console.error(`Помилка при підрахунку записів в ${this.tableName}:`, error);
            throw new Error(`Не вдалося підрахувати записи в ${this.tableName}`);
        }
    }

    /**
     * Створити стандартну відповідь API
     */
    protected createApiResponse<TData>(success: boolean, data?: TData, message?: string, error?: string): ApiResponse<TData> {
        return {
            success,
            data,
            message,
            error
        };
    }

    /**
     * Валідація ID
     */
    protected validateId(id: any): number {
        const numId = parseInt(id, 10);
        if (isNaN(numId) || numId <= 0) {
            throw new Error('Невірний ID');
        }
        return numId;
    }
} 