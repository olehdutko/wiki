/**
 * Спеціалізовані контролери для всіх сутностей
 */

import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import {
    Apple, BladeType, Category, Dolls, Epoha, GlobalType, GuardType,
    Sharpening, Usage, WeaponItem
} from '../models/entities.models';
import {
    AppleService, BladeTypeService, CategoryService, DollsService, EpohaService,
    GlobalTypeService, GuardTypeService, SharpeningService, UsageService,
    WeaponItemService
} from '../services/entities.services';
import { PaginationParams, ApiResponse } from '../types/base.types';

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

// ================= КОНТРОЛЕР КАТЕГОРІЙ =================

export class CategoryController extends BaseController<Category> {
    private categoryService: CategoryService;

    constructor() {
        const service = new CategoryService();
        super(service);
        this.categoryService = service;
    }

    /**
     * Пошук категорій (переписуємо базовий метод для специфічного пошуку)
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

            const results = await this.categoryService.search(searchTerm.trim());

            const response: ApiResponse = this.createSuccessResponse(
                results,
                `Знайдено ${results.length} категорій`
            );

            res.status(200).json(response);
        } catch (error) {
            console.error('Помилка при пошуку категорій:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося виконати пошук категорій',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }
}

// ================= ГОЛОВНИЙ КОНТРОЛЕР ДЛЯ WEAPON ITEMS =================

export class WeaponItemController extends BaseController<WeaponItem> {
    private weaponService: WeaponItemService;

    constructor() {
        const service = new WeaponItemService();
        super(service);
        this.weaponService = service;
    }

    /**
     * Отримати всі записи зброї з інформацією про категорії
     */
    async getAllWithCategory(req: Request, res: Response): Promise<void> {
        try {
            const params: PaginationParams = {
                page: parseInt(req.query.page as string) || 1,
                limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
                sortBy: req.query.sortBy as string || 'id',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC'
            };

            const result = await this.weaponService.findAllWithCategory(params);

            const response: ApiResponse = this.createSuccessResponse(
                result,
                `Записи зброї успішно отримано. Всього: ${result.total}`
            );

            res.status(200).json(response);
        } catch (error) {
            console.error('Помилка при отриманні записів зброї:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося отримати записи зброї',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }

    /**
     * Отримати запис зброї за ID з інформацією про категорію
     */
    async getByIdWithCategory(req: Request, res: Response): Promise<void> {
        try {
            const id = this.validateId(req.params.id);
            const record = await this.weaponService.findByIdWithCategory(id);

            if (!record) {
                const response: ApiResponse = this.createErrorResponse(
                    `Запис зброї з ID ${id} не знайдено`,
                    'NOT_FOUND'
                );
                res.status(404).json(response);
                return;
            }

            const response: ApiResponse = this.createSuccessResponse(
                record,
                'Запис зброї успішно отримано'
            );

            res.status(200).json(response);
        } catch (error) {
            console.error('Помилка при отриманні запису зброї за ID:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося отримати запис зброї',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(400).json(response);
        }
    }

    /**
     * Створити новий запис зброї
     */
    async createWeapon(req: Request, res: Response): Promise<void> {
        try {
            const record = await this.weaponService.createWeaponItem(req.body);

            const response: ApiResponse = this.createSuccessResponse(
                record,
                'Запис зброї успішно створено'
            );

            res.status(201).json(response);
        } catch (error) {
            console.error('Помилка при створенні запису зброї:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося створити запис зброї',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }

    /**
     * Оновити запис зброї
     */
    async updateWeapon(req: Request, res: Response): Promise<void> {
        try {
            const id = this.validateId(req.params.id);
            const updatedRecord = await this.weaponService.updateWeaponItem(id, req.body);

            if (!updatedRecord) {
                const response: ApiResponse = this.createErrorResponse(
                    `Запис зброї з ID ${id} не знайдено`,
                    'NOT_FOUND'
                );
                res.status(404).json(response);
                return;
            }

            const response: ApiResponse = this.createSuccessResponse(
                updatedRecord,
                'Запис зброї успішно оновлено'
            );

            res.status(200).json(response);
        } catch (error) {
            console.error('Помилка при оновленні запису зброї:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося оновити запис зброї',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }

    /**
     * Пошук зброї
     */
    async searchWeapons(req: Request, res: Response): Promise<void> {
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

            const params: PaginationParams = {
                page: parseInt(req.query.page as string) || 1,
                limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
                sortBy: req.query.sortBy as string || 'id',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC'
            };

            const results = await this.weaponService.searchWeapons(searchTerm.trim(), params);

            const response: ApiResponse = this.createSuccessResponse(
                results,
                `Знайдено ${results.total} записів зброї`
            );

            res.status(200).json(response);
        } catch (error) {
            console.error('Помилка при пошуку зброї:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося виконати пошук зброї',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }

    /**
     * Отримати зброю за категорією
     */
    async getByCategory(req: Request, res: Response): Promise<void> {
        try {
            const categoryId = this.validateId(req.params.categoryId);

            const params: PaginationParams = {
                page: parseInt(req.query.page as string) || 1,
                limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
                sortBy: req.query.sortBy as string || 'id',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC'
            };

            const results = await this.weaponService.findByCategory(categoryId, params);

            const response: ApiResponse = this.createSuccessResponse(
                results,
                `Знайдено ${results.total} записів зброї в категорії`
            );

            res.status(200).json(response);
        } catch (error) {
            console.error('Помилка при отриманні зброї за категорією:', error);
            const response: ApiResponse = this.createErrorResponse(
                'Не вдалося отримати зброю за категорією',
                error instanceof Error ? error.message : 'Невідома помилка'
            );
            res.status(500).json(response);
        }
    }
}

// ================= ФАБРИКА КОНТРОЛЕРІВ =================

export class ControllerFactory {
    private static instances: Map<string, any> = new Map();

    static getController<T extends BaseController<any>>(entityName: string): T {
        if (!this.instances.has(entityName)) {
            switch (entityName) {
                case 'apple':
                    this.instances.set(entityName, new AppleController());
                    break;
                case 'blade_type':
                    this.instances.set(entityName, new BladeTypeController());
                    break;
                case 'categories':
                    this.instances.set(entityName, new CategoryController());
                    break;
                case 'dolls':
                    this.instances.set(entityName, new DollsController());
                    break;
                case 'epoha':
                    this.instances.set(entityName, new EpohaController());
                    break;
                case 'global_type':
                    this.instances.set(entityName, new GlobalTypeController());
                    break;
                case 'guard_type':
                    this.instances.set(entityName, new GuardTypeController());
                    break;
                case 'sharpening':
                    this.instances.set(entityName, new SharpeningController());
                    break;
                case 'usage':
                    this.instances.set(entityName, new UsageController());
                    break;
                case 'items':
                    this.instances.set(entityName, new WeaponItemController());
                    break;
                default:
                    throw new Error(`Невідомий тип сутності: ${entityName}`);
            }
        }

        return this.instances.get(entityName);
    }
} 