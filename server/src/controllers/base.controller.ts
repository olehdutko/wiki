/**
 * Базовий контролер для CRUD операцій
 * Реалізує принципи DRY, KISS та SOLID
 */

import { Request, Response } from 'express';
import { BaseService } from '../services/base.service';
import { BaseEntity, ApiResponse, PaginationParams } from '../types/base.types';
import { validationResult } from 'express-validator';

export abstract class BaseController<T extends BaseEntity> {
    protected service: BaseService<T>;

    constructor(service: BaseService<T>) {
        this.service = service;
    }

    /**
     * Отримати всі записи
     */
    async getAll(req: Request, res: Response): Promise<void> {
        try {
            const params: PaginationParams = {
                page: parseInt(req.query.page as string) || 1,
                limit: Math.min(parseInt(req.query.limit as string) || 20, 10000), // Максимум 10000 записів
                sortBy: req.query.sortBy as string || 'id',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC'
            };

            const result = await this.service.findAll(params);

            const response: ApiResponse = this.createSuccessResponse(
                result,
                `Записи успішно отримано. Всього: ${result.total}`
            );

            res.status(200).json(response);
        } catch (error) {
            console.error('Помилка при отриманні записів:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося отримати записи',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }

    /**
     * Отримати запис за ID
     */
    async getById(req: Request, res: Response): Promise<void> {
        try {
            const id = this.validateId(req.params.id);
            const record = await this.service.findById(id);

            if (!record) {
                const response: ApiResponse = this.createErrorResponse(
                    `Запис з ID ${id} не знайдено`,
                    'NOT_FOUND'
                );
                res.status(404).json(response);
                return;
            }

            const response: ApiResponse = this.createSuccessResponse(
                record,
                'Запис успішно отримано'
            );

            res.status(200).json(response);
        } catch (error) {
            console.error('Помилка при отриманні запису за ID:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося отримати запис',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(400).json(response);
        }
    }

    /**
     * Створити новий запис
     */
    async create(req: Request, res: Response): Promise<void> {
        try {
            // Перевірка валідації
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const response: ApiResponse = this.createErrorResponse(
                    'Помилки валідації',
                    'VALIDATION_ERROR',
                    errors.array()
                );
                res.status(400).json(response);
                return;
            }

            const record = await this.service.create(req.body);

            const response: ApiResponse = this.createSuccessResponse(
                record,
                'Запис успішно створено'
            );

            res.status(201).json(response);
        } catch (error) {
            console.error('Помилка при створенні запису:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося створити запис',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }

    /**
     * Оновити запис
     */
    async update(req: Request, res: Response): Promise<void> {
        try {
            console.log('🔄 UPDATE запит отримано:', {
                url: req.url,
                method: req.method,
                id: req.params.id,
                body: req.body,
                headers: req.headers
            });

            // Перевірка валідації
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.warn('❌ Помилки валідації:', errors.array());
                const response: ApiResponse = this.createErrorResponse(
                    'Помилки валідації',
                    'VALIDATION_ERROR',
                    errors.array()
                );
                res.status(400).json(response);
                return;
            }

            const id = this.validateId(req.params.id);
            console.log('✅ ID валідовано:', id);
            console.log('📝 Дані для оновлення:', req.body);

            const updatedRecord = await this.service.update(id, req.body);

            console.log('🔄 Результат оновлення:', updatedRecord);

            if (!updatedRecord) {
                console.warn('❌ Запис не знайдено для оновлення, ID:', id);
                const response: ApiResponse = this.createErrorResponse(
                    `Запис з ID ${id} не знайдено`,
                    'NOT_FOUND'
                );
                res.status(404).json(response);
                return;
            }

            console.log('✅ Запис успішно оновлено:', updatedRecord);
            const response: ApiResponse = this.createSuccessResponse(
                updatedRecord,
                'Запис успішно оновлено'
            );

            res.status(200).json(response);
        } catch (error) {
            console.error('❌ Помилка при оновленні запису:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося оновити запис',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }

    /**
     * Видалити запис
     */
    async delete(req: Request, res: Response): Promise<void> {
        try {
            const id = this.validateId(req.params.id);

            // Перевіряємо чи існує запис
            const exists = await this.service.exists(id);
            if (!exists) {
                const response: ApiResponse = this.createErrorResponse(
                    `Запис з ID ${id} не знайдено`,
                    'NOT_FOUND'
                );
                res.status(404).json(response);
                return;
            }

            const deleted = await this.service.delete(id);

            if (deleted) {
                const response: ApiResponse = this.createSuccessResponse(
                    { id, deleted: true },
                    'Запис успішно видалено'
                );
                res.status(200).json(response);
            } else {
                const response: ApiResponse = this.createErrorResponse(
                    'Не вдалося видалити запис',
                    'DELETE_FAILED'
                );
                res.status(500).json(response);
            }
        } catch (error) {
            console.error('Помилка при видаленні запису:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося видалити запис',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }

    /**
     * Пошук записів
     */
    async search(req: Request, res: Response): Promise<void> {
        try {
            const searchTerm = req.query.q as string;

            if (!searchTerm || searchTerm.trim().length < 2) {
                const response: ApiResponse = this.createErrorResponse(
                    'Пошуковий запит повинен містити мінімум 2 символи',
                    'INVALID_SEARCH_TERM'
                );
                res.status(400).json(response);
                return;
            }

            const results = await this.service.search(searchTerm.trim());

            const response: ApiResponse = this.createSuccessResponse(
                results,
                `Знайдено ${results.length} записів`
            );

            res.status(200).json(response);
        } catch (error) {
            console.error('Помилка при пошуку:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося виконати пошук',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }

    /**
     * Отримати кількість записів
     */
    async getCount(_req: Request, res: Response): Promise<void> {
        try {
            const count = await this.service.count();

            const response: ApiResponse = this.createSuccessResponse(
                { count },
                'Кількість записів отримано'
            );

            res.status(200).json(response);
        } catch (error) {
            console.error('Помилка при підрахунку записів:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося підрахувати записи',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }

    async getMaxId(_req: Request, res: Response) {
        try {
            console.log('🔄 GET max-id запит отримано');
            const maxId = await this.service.getMaxId();
            console.log('✅ Максимальний ID:', maxId);

            const response: ApiResponse = this.createSuccessResponse(
                { maxId },
                'Максимальний ID отримано'
            );

            res.status(200).json(response);
        } catch (error) {
            console.error('❌ Помилка отримання максимального ID:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося отримати максимальний ID',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }

    // ================= УТИЛІТНІ МЕТОДИ =================

    /**
     * Створити успішну відповідь API
     */
    protected createSuccessResponse<TData>(data?: TData, message?: string): ApiResponse<TData> {
        return {
            success: true,
            data,
            message
        };
    }

    /**
     * Створити відповідь з помилкою
     */
    protected createErrorResponse(message: string, error?: string, details?: any): ApiResponse {
        return {
            success: false,
            message,
            error,
            data: details
        };
    }

    /**
     * Валідація ID
     */
    protected validateId(id: string): number {
        const numId = parseInt(id, 10);
        if (isNaN(numId) || numId <= 0) {
            throw new Error('Невірний формат ID');
        }
        return numId;
    }

    /**
     * Створити handler для асинхронних операцій (wrapper для помилок)
     */
    protected asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
        return (req: Request, res: Response) => {
            Promise.resolve(fn(req, res)).catch((error) => {
                console.error('Неочікувана помилка в контролері:', error);
                const response: ApiResponse = this.createErrorResponse(
                    'Внутрішня помилка сервера',
                    error.message
                );
                res.status(500).json(response);
            });
        };
    }
} 