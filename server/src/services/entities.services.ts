/**
 * Спеціалізовані сервіси для всіх сутностей
 */

import { RowDataPacket } from 'mysql2';
import { BaseService } from './base.service';
import { pool } from '../config/database.config';
import {
    Apple, BladeType, Category, Dolls, Epoha, GlobalType, GuardType,
    Sharpening, Usage, WeaponItem, WeaponItemResponse, CreateWeaponItemDto, UpdateWeaponItemDto
} from '../models/entities.models';
import { PaginationParams, PaginatedResponse } from '../types/base.types';

// ================= ДОВІДКОВІ СЕРВІСИ =================

export class AppleService extends BaseService<Apple> {
    constructor() {
        super('apple');
    }
}

export class BladeTypeService extends BaseService<BladeType> {
    constructor() {
        super('blade_type');
    }
}

export class DollsService extends BaseService<Dolls> {
    constructor() {
        super('dolls');
    }
}

export class EpohaService extends BaseService<Epoha> {
    constructor() {
        super('epoha');
    }
}

export class GlobalTypeService extends BaseService<GlobalType> {
    constructor() {
        super('global_type');
    }
}

export class GuardTypeService extends BaseService<GuardType> {
    constructor() {
        super('guard_type');
    }
}

export class SharpeningService extends BaseService<Sharpening> {
    constructor() {
        super('sharpening');
    }
}

export class UsageService extends BaseService<Usage> {
    constructor() {
        super('usage');
    }
}

// ================= СЕРВІС КАТЕГОРІЙ =================

export class CategoryService extends BaseService<Category> {
    constructor() {
        super('categories');
    }

    /**
     * Пошук категорій за назвою
     */
    async search(searchTerm: string): Promise<Category[]> {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM ${this.tableName} 
         WHERE ukr_name LIKE ? OR eng_name LIKE ? OR comments LIKE ?
         ORDER BY ukr_name`,
                [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
            ) as [RowDataPacket[], any];

            return rows as Category[];
        } catch (error) {
            console.error(`Помилка при пошуку категорій:`, error);
            throw new Error('Не вдалося виконати пошук категорій');
        }
    }
}

// ================= ГОЛОВНИЙ СЕРВІС ДЛЯ WEAPON ITEMS =================

export class WeaponItemService extends BaseService<WeaponItem> {
    constructor() {
        super('items');
    }

    /**
     * Отримати всі записи з інформацією про категорію
     */
    async findAllWithCategory(params: PaginationParams = {}): Promise<PaginatedResponse<WeaponItemResponse>> {
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

            // Отримання записів з інформацією про категорію
            const [rows] = await pool.execute(
                `SELECT i.*, c.ukr_name as category_ukr_name, c.eng_name as category_eng_name, c.comments as category_comments
         FROM items i
         LEFT JOIN categories c ON i.category_id = c.id
         ORDER BY i.${sortBy} ${sortOrder}
         LIMIT ${limit} OFFSET ${offset}`
            ) as [RowDataPacket[], any];

            // Трансформуємо результат для включення інформації про категорію
            const items: WeaponItemResponse[] = rows.map((row: any) => {
                const { category_ukr_name, category_eng_name, category_comments, ...itemData } = row;

                return {
                    ...itemData,
                    category: category_ukr_name ? {
                        id: itemData.category_id,
                        ukr_name: category_ukr_name,
                        eng_name: category_eng_name,
                        comments: category_comments
                    } : undefined
                } as WeaponItemResponse;
            });

            return {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error(`Помилка при отриманні записів зброї з категоріями:`, error);
            throw new Error('Не вдалося отримати записи зброї');
        }
    }

    /**
     * Отримати запис за ID з інформацією про категорію
     */
    async findByIdWithCategory(id: number): Promise<WeaponItemResponse | null> {
        try {
            const [rows] = await pool.execute(
                `SELECT i.*, c.ukr_name as category_ukr_name, c.eng_name as category_eng_name, c.comments as category_comments
         FROM items i
         LEFT JOIN categories c ON i.category_id = c.id
         WHERE i.id = ?`,
                [id]
            ) as [RowDataPacket[], any];

            if (rows.length === 0) {
                return null;
            }

            const row = rows[0];
            const { category_ukr_name, category_eng_name, category_comments, ...itemData } = row;

            return {
                ...itemData,
                category: category_ukr_name ? {
                    id: itemData.category_id,
                    ukr_name: category_ukr_name,
                    eng_name: category_eng_name,
                    comments: category_comments
                } : undefined
            } as WeaponItemResponse;
        } catch (error) {
            console.error(`Помилка при отриманні запису зброї з категорією по ID ${id}:`, error);
            throw new Error(`Не вдалося отримати запис зброї по ID ${id}`);
        }
    }

    /**
     * Створити новий запис зброї
     */
    async createWeaponItem(data: CreateWeaponItemDto): Promise<WeaponItemResponse> {
        try {
            const created = await this.create(data);
            const withCategory = await this.findByIdWithCategory(created.id);

            if (!withCategory) {
                throw new Error('Створений запис не знайдено');
            }

            return withCategory;
        } catch (error) {
            console.error('Помилка при створенні запису зброї:', error);
            throw new Error('Не вдалося створити запис зброї');
        }
    }

    /**
     * Оновити запис зброї
     */
    async updateWeaponItem(id: number, data: UpdateWeaponItemDto): Promise<WeaponItemResponse | null> {
        try {
            const updated = await this.update(id, data);
            if (!updated) {
                return null;
            }

            return await this.findByIdWithCategory(id);
        } catch (error) {
            console.error(`Помилка при оновленні запису зброї з ID ${id}:`, error);
            throw new Error(`Не вдалося оновити запис зброї з ID ${id}`);
        }
    }

    /**
     * Пошук зброї за різними критеріями
     */
    async searchWeapons(searchTerm: string, params: PaginationParams = {}): Promise<PaginatedResponse<WeaponItemResponse>> {
        const {
            page = 1,
            limit = 20,
            sortBy = 'id',
            sortOrder = 'DESC'
        } = params;

        const offset = (page - 1) * limit;

        try {
            const searchPattern = `%${searchTerm}%`;

            // Підрахунок загальної кількості записів
            const [countResult] = await pool.execute(
                `SELECT COUNT(*) as total FROM items i
         WHERE i.ukr_name LIKE ? OR i.eng_name LIKE ? OR i.rus_name LIKE ? 
            OR i.description_ukr LIKE ? OR i.description_eng LIKE ? OR i.description_rus LIKE ?
            OR i.theritory LIKE ? OR i.century LIKE ?`,
                [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Отримання записів
            const [rows] = await pool.execute(
                `SELECT i.*, c.ukr_name as category_ukr_name, c.eng_name as category_eng_name, c.comments as category_comments
         FROM items i
         LEFT JOIN categories c ON i.category_id = c.id
         WHERE i.ukr_name LIKE ? OR i.eng_name LIKE ? OR i.rus_name LIKE ? 
            OR i.description_ukr LIKE ? OR i.description_eng LIKE ? OR i.description_rus LIKE ?
            OR i.theritory LIKE ? OR i.century LIKE ?
         ORDER BY i.${sortBy} ${sortOrder}
         LIMIT ${limit} OFFSET ${offset}`,
                [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
            ) as [RowDataPacket[], any];

            // Трансформуємо результат
            const items: WeaponItemResponse[] = rows.map((row: any) => {
                const { category_ukr_name, category_eng_name, category_comments, ...itemData } = row;

                return {
                    ...itemData,
                    category: category_ukr_name ? {
                        id: itemData.category_id,
                        ukr_name: category_ukr_name,
                        eng_name: category_eng_name,
                        comments: category_comments
                    } : undefined
                } as WeaponItemResponse;
            });

            return {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Помилка при пошуку зброї:', error);
            throw new Error('Не вдалося виконати пошук зброї');
        }
    }

    /**
     * Отримати записи за категорією
     */
    async findByCategory(categoryId: number, params: PaginationParams = {}): Promise<PaginatedResponse<WeaponItemResponse>> {
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
                `SELECT COUNT(*) as total FROM items WHERE category_id = ?`,
                [categoryId]
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Отримання записів
            const [rows] = await pool.execute(
                `SELECT i.*, c.ukr_name as category_ukr_name, c.eng_name as category_eng_name, c.comments as category_comments
         FROM items i
         LEFT JOIN categories c ON i.category_id = c.id
         WHERE i.category_id = ?
         ORDER BY i.${sortBy} ${sortOrder}
         LIMIT ${limit} OFFSET ${offset}`,
                [categoryId]
            ) as [RowDataPacket[], any];

            // Трансформуємо результат
            const items: WeaponItemResponse[] = rows.map((row: any) => {
                const { category_ukr_name, category_eng_name, category_comments, ...itemData } = row;

                return {
                    ...itemData,
                    category: category_ukr_name ? {
                        id: itemData.category_id,
                        ukr_name: category_ukr_name,
                        eng_name: category_eng_name,
                        comments: category_comments
                    } : undefined
                } as WeaponItemResponse;
            });

            return {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error(`Помилка при отриманні зброї за категорією ${categoryId}:`, error);
            throw new Error(`Не вдалося отримати зброю за категорією ${categoryId}`);
        }
    }
}

// ================= ФАБРИКА СЕРВІСІВ =================

export class ServiceFactory {
    private static instances: Map<string, any> = new Map();

    static getService<T extends BaseService<any>>(entityName: string): T {
        if (!this.instances.has(entityName)) {
            switch (entityName) {
                case 'apple':
                    this.instances.set(entityName, new AppleService());
                    break;
                case 'blade_type':
                    this.instances.set(entityName, new BladeTypeService());
                    break;
                case 'categories':
                    this.instances.set(entityName, new CategoryService());
                    break;
                case 'dolls':
                    this.instances.set(entityName, new DollsService());
                    break;
                case 'epoha':
                    this.instances.set(entityName, new EpohaService());
                    break;
                case 'global_type':
                    this.instances.set(entityName, new GlobalTypeService());
                    break;
                case 'guard_type':
                    this.instances.set(entityName, new GuardTypeService());
                    break;
                case 'sharpening':
                    this.instances.set(entityName, new SharpeningService());
                    break;
                case 'usage':
                    this.instances.set(entityName, new UsageService());
                    break;
                case 'items':
                    this.instances.set(entityName, new WeaponItemService());
                    break;
                default:
                    throw new Error(`Невідомий тип сутності: ${entityName}`);
            }
        }

        return this.instances.get(entityName);
    }
} 