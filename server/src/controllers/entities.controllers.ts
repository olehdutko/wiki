/**
 * Спеціалізовані контролери для всіх сутностей
 */

import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { pool } from '../config/database.config';
import type { RowDataPacket } from 'mysql2';
import {
    AppleService, BladeTypeService, CategoryService, DollsService, EpohaService,
    GlobalTypeService, GuardTypeService, SharpeningService, UsageService,
    WeaponItemService
} from '../services/entities.services';
import { PaginationParams } from '../types/base.types';
import {
    Apple, BladeType, Category, Dolls, Epoha, GlobalType, GuardType,
    Sharpening, Usage
} from '../models/entities.models';

interface LinkedObject extends RowDataPacket {
    id: number;
    item_id: number;
    other_item: number;
    ukr_name: string;
    eng_name: string;
    rus_name: string;
}

export class LinksController {
    async getLinkedObjects(req: Request, res: Response): Promise<void> {
        try {
            const itemId = parseInt(req.params.id);
            if (isNaN(itemId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid ID format'
                });
                return;
            }

            const [rows] = await pool.query<LinkedObject[]>(`
                SELECT 
                    l.id,
                    l.item_id,
                    l.other_item,
                    i.ukr_name,
                    i.eng_name,
                    i.rus_name
                FROM 
                    links l
                JOIN 
                    items i ON (
                        CASE 
                            WHEN l.item_id = ? THEN l.other_item = i.id
                            WHEN l.other_item = ? THEN l.item_id = i.id
                        END
                    )
                WHERE 
                    l.item_id = ? OR l.other_item = ?
            `, [itemId, itemId, itemId, itemId]);

            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Error getting linked objects:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

// ================= ДОВІДКОВІ КОНТРОЛЕРИ =================

export class AppleController extends BaseController<Apple> {
    constructor() {
        super(new AppleService());
    }
}

export class BladeTypeController extends BaseController<BladeType> {
    constructor() {
        super(new BladeTypeService());
    }
}

export class CategoryController extends BaseController<Category> {
    constructor() {
        super(new CategoryService());
    }
}

export class DollsController extends BaseController<Dolls> {
    constructor() {
        super(new DollsService());
    }
}

export class EpohaController extends BaseController<Epoha> {
    constructor() {
        super(new EpohaService());
    }
}

export class GlobalTypeController extends BaseController<GlobalType> {
    constructor() {
        super(new GlobalTypeService());
    }
}

export class GuardTypeController extends BaseController<GuardType> {
    constructor() {
        super(new GuardTypeService());
    }
}

export class SharpeningController extends BaseController<Sharpening> {
    constructor() {
        super(new SharpeningService());
    }
}

export class UsageController extends BaseController<Usage> {
    constructor() {
        super(new UsageService());
    }
}

// ================= ГОЛОВНИЙ КОНТРОЛЕР =================

export class WeaponItemController {
    private weaponService: WeaponItemService;

    constructor() {
        this.weaponService = new WeaponItemService();
    }

    async getAllWithCategory(req: Request, res: Response): Promise<void> {
        try {
            const params: PaginationParams = {
                page: parseInt(req.query.page as string) || 1,
                limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
                sortBy: req.query.sortBy as string || 'id',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC'
            };

            const result = await this.weaponService.findAllWithCategory(params);

            res.status(200).json({
                success: true,
                data: result,
                message: `Записи успішно отримано. Всього: ${result.total}`
            });
        } catch (error) {
            console.error('Помилка при отриманні записів:', error);
            res.status(500).json({
                success: false,
                message: 'Не вдалося отримати записи',
                error: error instanceof Error ? error.message : 'Невідома помилка'
            });
        }
    }

    async getByIdWithCategory(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Невірний формат ID'
                });
                return;
            }

            const record = await this.weaponService.findByIdWithCategory(id);

            if (!record) {
                res.status(404).json({
                    success: false,
                    message: `Запис з ID ${id} не знайдено`
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: record,
                message: 'Запис успішно отримано'
            });
        } catch (error) {
            console.error('Помилка при отриманні запису:', error);
            res.status(500).json({
                success: false,
                message: 'Не вдалося отримати запис',
                error: error instanceof Error ? error.message : 'Невідома помилка'
            });
        }
    }

    async getByCategory(req: Request, res: Response): Promise<void> {
        try {
            const categoryId = parseInt(req.params.categoryId);
            if (isNaN(categoryId)) {
                res.status(400).json({
                    success: false,
                    message: 'Невірний формат ID категорії'
                });
                return;
            }

            const params: PaginationParams = {
                page: parseInt(req.query.page as string) || 1,
                limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
                sortBy: req.query.sortBy as string || 'id',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC'
            };

            const result = await this.weaponService.findByCategory(categoryId, params);

            res.status(200).json({
                success: true,
                data: result,
                message: `Записи успішно отримано. Всього: ${result.total}`
            });
        } catch (error) {
            console.error('Помилка при отриманні записів за категорією:', error);
            res.status(500).json({
                success: false,
                message: 'Не вдалося отримати записи',
                error: error instanceof Error ? error.message : 'Невідома помилка'
            });
        }
    }

    async searchWeapons(req: Request, res: Response): Promise<void> {
        try {
            const searchTerm = req.query.q as string;
            const params: PaginationParams = {
                page: parseInt(req.query.page as string) || 1,
                limit: Math.min(parseInt(req.query.limit as string) || 20, 100)
            };

            if (!searchTerm || searchTerm.trim().length < 2) {
                res.status(400).json({
                    success: false,
                    message: 'Пошуковий запит повинен містити мінімум 2 символи'
                });
                return;
            }

            const result = await this.weaponService.searchWithPagination(searchTerm.trim(), params);

            res.status(200).json({
                success: true,
                data: result,
                message: `Знайдено ${result.total} записів`
            });
        } catch (error) {
            console.error('Помилка при пошуку:', error);
            res.status(500).json({
                success: false,
                message: 'Не вдалося виконати пошук',
                error: error instanceof Error ? error.message : 'Невідома помилка'
            });
        }
    }

    async createWeapon(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.weaponService.create(req.body);

            res.status(201).json({
                success: true,
                data: result,
                message: 'Запис успішно створено'
            });
        } catch (error) {
            console.error('Помилка при створенні запису:', error);
            res.status(500).json({
                success: false,
                message: 'Не вдалося створити запис',
                error: error instanceof Error ? error.message : 'Невідома помилка'
            });
        }
    }

    async updateWeapon(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Невірний формат ID'
                });
                return;
            }

            const result = await this.weaponService.update(id, req.body);

            if (!result) {
                res.status(404).json({
                    success: false,
                    message: `Запис з ID ${id} не знайдено`
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Запис успішно оновлено'
            });
        } catch (error) {
            console.error('Помилка при оновленні запису:', error);
            res.status(500).json({
                success: false,
                message: 'Не вдалося оновити запис',
                error: error instanceof Error ? error.message : 'Невідома помилка'
            });
        }
    }

    // Add missing methods
    async getCount(_req: Request, res: Response): Promise<void> {
        try {
            const count = await this.weaponService.count();
            res.status(200).json({
                success: true,
                data: count,
                message: 'Кількість записів успішно отримано'
            });
        } catch (error) {
            console.error('Помилка при отриманні кількості записів:', error);
            res.status(500).json({
                success: false,
                message: 'Не вдалося отримати кількість записів',
                error: error instanceof Error ? error.message : 'Невідома помилка'
            });
        }
    }

    async getMaxId(_req: Request, res: Response): Promise<void> {
        try {
            const maxId = await this.weaponService.getMaxId();
            res.status(200).json({
                success: true,
                data: maxId,
                message: 'Максимальний ID успішно отримано'
            });
        } catch (error) {
            console.error('Помилка при отриманні максимального ID:', error);
            res.status(500).json({
                success: false,
                message: 'Не вдалося отримати максимальний ID',
                error: error instanceof Error ? error.message : 'Невідома помилка'
            });
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Невірний формат ID'
                });
                return;
            }

            const success = await this.weaponService.delete(id);

            if (!success) {
                res.status(404).json({
                    success: false,
                    message: `Запис з ID ${id} не знайдено`
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Запис успішно видалено'
            });
        } catch (error) {
            console.error('Помилка при видаленні запису:', error);
            res.status(500).json({
                success: false,
                message: 'Не вдалося видалити запис',
                error: error instanceof Error ? error.message : 'Невідома помилка'
            });
        }
    }
} 