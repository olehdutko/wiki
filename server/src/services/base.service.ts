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
     * Конвертує значення з бази даних в правильні типи
     */
    protected convertDatabaseValues(record: any): any {
        if (!record) return record;

        const converted = { ...record };

        // Конвертуємо boolean поля (0/1 -> true/false)
        Object.keys(converted).forEach(key => {
            const value = converted[key];
            // Перевіряємо тільки поля, які можуть бути boolean
            if (key === 'ready' || key === 'active' || key === 'enabled' || key === 'visible') {
                if (typeof value === 'number') {
                    converted[key] = Boolean(value);
                } else if (typeof value === 'boolean') {
                    converted[key] = value;
                } else if (value === 'true' || value === '1' || value === true) {
                    converted[key] = true;
                } else if (value === 'false' || value === '0' || value === false || value === '' || value === null || value === undefined) {
                    converted[key] = false;
                } else {
                    converted[key] = Boolean(value);
                }
            }
        });

        return converted;
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
                `SELECT COUNT(*) as total FROM \`${this.tableName}\``
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Отримання записів з пагінацією
            const [rows] = await pool.execute(
                `SELECT * FROM \`${this.tableName}\` ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`
            ) as [RowDataPacket[], any];

            // Конвертуємо значення для всіх записів
            const convertedRows = rows.map(row => this.convertDatabaseValues(row));

            return {
                items: convertedRows as T[],
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
                `SELECT * FROM \`${this.tableName}\` WHERE id = ?`,
                [id]
            ) as [RowDataPacket[], any];

            return rows.length > 0 ? this.convertDatabaseValues(rows[0]) as T : null;
        } catch (error) {
            console.error(`Помилка при отриманні запису з ${this.tableName} по ID ${id}:`, error);
            throw new Error(`Не вдалося отримати запис по ID ${id}`);
        }
    }

    /**
     * Створити новий запис
     */
    async create(data: Omit<T, 'id'>): Promise<T> {
        // Обробка boolean полів перед збереженням
        const processedData = { ...data } as any;

        // Конвертуємо boolean поля
        Object.keys(processedData).forEach(key => {
            const value = processedData[key];
            // Перевіряємо тільки поля, які можуть бути boolean
            if (key === 'ready' || key === 'active' || key === 'enabled' || key === 'visible') {
                if (typeof value === 'boolean') {
                    processedData[key] = value ? 1 : 0;
                } else if (value === 'true' || value === true) {
                    processedData[key] = 1;
                } else if (value === 'false' || value === false || value === '' || value === null || value === undefined) {
                    processedData[key] = 0;
                } else {
                    processedData[key] = 0; // За замовчуванням false
                }
            }
        });

        const fields = Object.keys(processedData).join(', ');
        const placeholders = Object.keys(processedData).map(() => '?').join(', ');
        const values = Object.values(processedData);

        try {
            const [result] = await pool.execute(
                `INSERT INTO \`${this.tableName}\` (${fields}) VALUES (${placeholders})`,
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
        console.log('🔄 BaseService.update викликано:', { id, data, tableName: this.tableName });

        // Обробка boolean полів перед збереженням
        const processedData = { ...data } as any;

        // Конвертуємо boolean поля
        Object.keys(processedData).forEach(key => {
            const value = processedData[key];
            // Перевіряємо тільки поля, які можуть бути boolean
            if (key === 'ready' || key === 'active' || key === 'enabled' || key === 'visible') {
                if (typeof value === 'boolean') {
                    processedData[key] = value ? 1 : 0;
                } else if (value === 'true' || value === true) {
                    processedData[key] = 1;
                } else if (value === 'false' || value === false || value === '' || value === null || value === undefined) {
                    processedData[key] = 0;
                } else {
                    processedData[key] = 0; // За замовчуванням false
                }
            }
        });

        const fields = Object.keys(processedData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(processedData), id];

        console.log('📝 SQL запит:', `UPDATE \`${this.tableName}\` SET ${fields} WHERE id = ?`);
        console.log('🔢 Значення для SQL:', values);

        try {
            const [result] = await pool.execute(
                `UPDATE \`${this.tableName}\` SET ${fields} WHERE id = ?`,
                values
            ) as [ResultSetHeader, any];

            console.log('🔄 Результат SQL оновлення:', result);

            if (result.affectedRows === 0) {
                console.warn('⚠️ Жодного рядка не оновлено, ID:', id);
                return null;
            }

            console.log('✅ Рядок успішно оновлено, affectedRows:', result.affectedRows);

            const updatedRecord = await this.findById(id);
            console.log('🔄 Оновлений запис:', updatedRecord);

            return updatedRecord;
        } catch (error) {
            console.error(`❌ Помилка при оновленні запису в ${this.tableName} з ID ${id}:`, error);
            throw new Error(`Не вдалося оновити запис з ID ${id}`);
        }
    }

    /**
     * Видалити запис
     */
    async delete(id: number): Promise<boolean> {
        try {
            const [result] = await pool.execute(
                `DELETE FROM \`${this.tableName}\` WHERE id = ?`,
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
                `SELECT 1 FROM \`${this.tableName}\` WHERE id = ? LIMIT 1`,
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
                `SELECT * FROM \`${this.tableName}\` WHERE ${conditions} ORDER BY id`,
                values
            ) as [RowDataPacket[], any];

            // Конвертуємо значення для всіх записів
            const convertedRows = rows.map(row => this.convertDatabaseValues(row));

            return convertedRows as T[];
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
                `SELECT COUNT(*) as count FROM \`${this.tableName}\``
            ) as [RowDataPacket[], any];

            return rows[0].count;
        } catch (error) {
            console.error(`Помилка при підрахунку записів в ${this.tableName}:`, error);
            throw new Error(`Не вдалося підрахувати записи в ${this.tableName}`);
        }
    }

    /**
     * Отримати максимальний ID з таблиці
     */
    async getMaxId(): Promise<number> {
        try {
            console.log('🔄 BaseService.getMaxId викликано:', { tableName: this.tableName });

            const [result] = await pool.execute(
                `SELECT MAX(id) as maxId FROM \`${this.tableName}\``
            ) as [RowDataPacket[], any];

            const maxId = result[0]?.maxId ?? 0;
            console.log('✅ Максимальний ID:', maxId);

            return maxId;
        } catch (error) {
            console.error('❌ Помилка отримання максимального ID:', error);
            throw error;
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