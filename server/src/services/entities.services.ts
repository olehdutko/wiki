/**
 * Спеціалізовані сервіси для всіх сутностей
 */

import type { RowDataPacket } from 'mysql2';
import { BaseService } from './base.service';
import { pool } from '../config/database.config';
import {
    Apple, BladeType, Category, Dolls, Epoha, GlobalType, GuardType,
    Sharpening, Usage, WeaponItem, WeaponItemResponse, CreateWeaponItemDto, UpdateWeaponItemDto
} from '../models/entities.models';
import { PaginationParams, PaginatedResponse } from '../types/base.types';

export { BaseService } from './base.service';

export interface Link extends RowDataPacket {
    id: number;
    item_id: number;
    other_item: number;
    ukr_name: string;
    eng_name: string;
    rus_name: string;
}

export class LinksService extends BaseService<Link> {
    constructor() {
        super('links');
    }
}

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
                `SELECT * FROM \`${this.tableName}\` 
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
     * Конвертує значення з бази даних в правильні типи для WeaponItem
     */
    protected convertDatabaseValues(record: any): any {
        if (!record) return record;

        const converted = { ...record };

        // Конвертуємо boolean поля для WeaponItem
        if (converted.ready !== undefined) {
            if (typeof converted.ready === 'number') {
                converted.ready = Boolean(converted.ready);
            } else if (typeof converted.ready === 'boolean') {
                converted.ready = converted.ready;
            } else if (converted.ready === 'true' || converted.ready === '1' || converted.ready === true) {
                converted.ready = true;
            } else if (converted.ready === 'false' || converted.ready === '0' || converted.ready === false || converted.ready === '' || converted.ready === null || converted.ready === undefined) {
                converted.ready = false;
            } else {
                converted.ready = Boolean(converted.ready);
            }
        }

        return converted;
    }

    async findAllWithCategory(params: PaginationParams): Promise<PaginatedResponse<WeaponItem>> {
        const {
            page = 1,
            limit = 20,
            sortBy = 'id',
            sortOrder = 'DESC'
        } = params;

        const offset = (page - 1) * limit;

        try {
            // Get total count
            const [countResult] = await pool.execute(
                'SELECT COUNT(*) as total FROM items'
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Get items with category
            const [rows] = await pool.query(`
                SELECT i.*, c.ukr_name as category_name
                FROM items i
                LEFT JOIN categories c ON i.category_id = c.id
                ORDER BY i.${sortBy} ${sortOrder}
                LIMIT ? OFFSET ?
            `, [limit, offset]);

            return {
                items: rows as WeaponItem[],
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error in findAllWithCategory:', error);
            throw error;
        }
    }

    async findByIdWithCategory(id: number): Promise<WeaponItem | null> {
        try {
            const [rows] = await pool.query(`
                SELECT i.*, c.ukr_name as category_name
                FROM items i
                LEFT JOIN categories c ON i.category_id = c.id
                WHERE i.id = ?
            `, [id]);

            const items = rows as WeaponItem[];
            return items.length > 0 ? items[0] : null;
        } catch (error) {
            console.error('Error in findByIdWithCategory:', error);
            throw error;
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
     * Override the base search method to support pagination
     */
    override async search(searchTerm: string, _fields?: string[]): Promise<WeaponItem[]> {
        // Call the paginated search with default parameters
        const result = await this.searchWithPagination(searchTerm, {
            page: 1,
            limit: 1000 // High limit to effectively get all results
        });
        return result.items;
    }

    /**
     * Extended search method with pagination support
     */
    async searchWithPagination(searchTerm: string, params: PaginationParams): Promise<PaginatedResponse<WeaponItem>> {
        const {
            page = 1,
            limit = 20,
            sortBy = 'id',
            sortOrder = 'DESC'
        } = params;

        const offset = (page - 1) * limit;
        const searchPattern = `%${searchTerm}%`;

        try {
            // Get total count for search
            const [countResult] = await pool.execute(
                `SELECT COUNT(*) as total FROM items 
                WHERE ukr_name LIKE ? OR eng_name LIKE ? OR rus_name LIKE ?`,
                [searchPattern, searchPattern, searchPattern]
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Get search results
            const [rows] = await pool.query(`
                SELECT i.*, c.ukr_name as category_name
                FROM items i
                LEFT JOIN categories c ON i.category_id = c.id
                WHERE i.ukr_name LIKE ? OR i.eng_name LIKE ? OR i.rus_name LIKE ?
                ORDER BY i.${sortBy} ${sortOrder}
                LIMIT ? OFFSET ?
            `, [searchPattern, searchPattern, searchPattern, limit, offset]);

            return {
                items: rows as WeaponItem[],
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error in search:', error);
            throw error;
        }
    }

    async findByCategory(categoryId: number, params: PaginationParams): Promise<PaginatedResponse<WeaponItem>> {
        const {
            page = 1,
            limit = 20,
            sortBy = 'id',
            sortOrder = 'DESC'
        } = params;

        const offset = (page - 1) * limit;

        try {
            // Get total count for category
            const [countResult] = await pool.execute(
                'SELECT COUNT(*) as total FROM items WHERE category_id = ?',
                [categoryId]
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Get items for category
            const [rows] = await pool.query(`
                SELECT i.*, c.ukr_name as category_name
                FROM items i
                LEFT JOIN categories c ON i.category_id = c.id
                WHERE i.category_id = ?
                ORDER BY i.${sortBy} ${sortOrder}
                LIMIT ? OFFSET ?
            `, [categoryId, limit, offset]);

            return {
                items: rows as WeaponItem[],
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error in findByCategory:', error);
            throw error;
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