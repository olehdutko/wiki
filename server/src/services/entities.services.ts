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
        super('item_links');
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

    /**
     * Отримати категорії для списку айтемів
     */
    private async loadCategoriesForItems(itemIds: number[]): Promise<Map<number, Category[]>> {
        if (itemIds.length === 0) {
            return new Map();
        }

        const placeholders = itemIds.map(() => '?').join(',');
        const [rows] = await pool.execute(
            `SELECT ic.item_id, ic.category_id, ic.is_primary, c.ukr_name, c.eng_name, c.comments
             FROM item_categories ic
             JOIN categories c ON ic.category_id = c.id
             WHERE ic.item_id IN (${placeholders})
             ORDER BY ic.is_primary DESC, c.ukr_name`,
            itemIds
        ) as [RowDataPacket[], any];

        const result = new Map<number, Category[]>();
        for (const row of rows) {
            const category: Category = {
                id: row.category_id,
                ukr_name: row.ukr_name,
                eng_name: row.eng_name,
                comments: row.comments
            };

            if (!result.has(row.item_id)) {
                result.set(row.item_id, []);
            }
            result.get(row.item_id)!.push(category);
        }

        return result;
    }

    /**
     * Зберегти зв'язки категорій для айтема
     */
    private async saveItemCategories(itemId: number, categoryIds: number[] | undefined, isPrimaryCategoryId?: number | null): Promise<Category[]> {
        // Якщо categoryIds не передано — нічого не змінюємо, повертаємо поточні
        if (!categoryIds || !Array.isArray(categoryIds)) {
            return this.getItemCategories(itemId);
        }

        // Нормалізуємо: унікальні ID, перше — основне
        const uniqueIds = [...new Set(categoryIds.filter(id => Number.isInteger(id) && id > 0))];
        if (uniqueIds.length === 0) {
            await pool.execute('DELETE FROM item_categories WHERE item_id = ?', [itemId]);
            return [];
        }

        const primaryId = isPrimaryCategoryId && uniqueIds.includes(isPrimaryCategoryId)
            ? isPrimaryCategoryId
            : uniqueIds[0];

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Видалити старі зв'язки
            await connection.execute('DELETE FROM item_categories WHERE item_id = ?', [itemId]);

            // Вставити нові
            const values = uniqueIds.map((catId) => [
                itemId,
                catId,
                catId === primaryId ? 1 : 0
            ]);

            await connection.query(
                `INSERT INTO item_categories (item_id, category_id, is_primary) VALUES ?`,
                [values]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        return this.getItemCategories(itemId);
    }

    /**
     * Отримати категорії конкретного айтема
     */
    private async getItemCategories(itemId: number): Promise<Category[]> {
        const [rows] = await pool.execute(
            `SELECT ic.category_id, ic.is_primary, c.ukr_name, c.eng_name, c.comments
             FROM item_categories ic
             JOIN categories c ON ic.category_id = c.id
             WHERE ic.item_id = ?
             ORDER BY ic.is_primary DESC, c.ukr_name`,
            [itemId]
        ) as [RowDataPacket[], any];

        return rows.map((row: any) => ({
            id: row.category_id,
            ukr_name: row.ukr_name,
            eng_name: row.eng_name,
            comments: row.comments
        })) as Category[];
    }

    /**
     * Допоміжний метод для отримання items з опціональним фільтром.
     * Не використовує GROUP_CONCAT для категорій, щоб уникнути втрати категорій
     * при фільтрації по одній з них.
     */
    private buildItemWithCategoriesQuery(whereClause = '', orderBy = 'i.id', limit?: number, offset?: number): string {
        let sql = `SELECT i.* FROM items i`;

        if (whereClause) {
            sql += ` WHERE ${whereClause}`;
        }

        sql += ` ORDER BY ${orderBy}`;

        if (limit !== undefined && offset !== undefined) {
            sql += ` LIMIT ${limit} OFFSET ${offset}`;
        }

        return sql;
    }

    /**
     * Видалити запис зброї та всі зв'язки з категоріями
     */
    async delete(id: number): Promise<boolean> {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute('DELETE FROM item_categories WHERE item_id = ?', [id]);
            await connection.execute('DELETE FROM item_links WHERE item_id = ? OR other_item = ?', [id, id]);
            await connection.execute('DELETE FROM items WHERE id = ?', [id]);
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async findAllWithCategories(params: PaginationParams, filterParams?: any): Promise<PaginatedResponse<WeaponItemResponse>> {
        const {
            page = 1,
            limit = 20,
            sortBy = 'id',
            sortOrder = 'DESC'
        } = params;

        const offset = (page - 1) * limit;

        try {
            // Build WHERE clause from filter params
            let whereConditions: string[] = [];
            let queryParams: any[] = [];
            
            if (filterParams) {
                let filterIndex = 0;
                while (filterParams[`filterField${filterIndex > 0 ? filterIndex : ''}`]) {
                    const suffix = filterIndex > 0 ? `${filterIndex}` : '';
                    const field = filterParams[`filterField${suffix}`];
                    const operator = filterParams[`filterOperator${suffix}`];
                    const value = filterParams[`filterValue${suffix}`];
                    
                    if (field && operator && value !== undefined) {
                        // Special handling for ID field (numeric)
                        if (field === 'id') {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue)) {
                                // MUI DataGrid operators: =, !=, >, >=, <, <=
                                switch (operator) {
                                    case '=':
                                    case 'eq':
                                    case 'equals':
                                        whereConditions.push(`i.id = ?`);
                                        queryParams.push(numValue);
                                        break;
                                    case '!=':
                                    case 'notEq':
                                    case 'notEquals':
                                        whereConditions.push(`i.id != ?`);
                                        queryParams.push(numValue);
                                        break;
                                    case '>':
                                    case 'gt':
                                        whereConditions.push(`i.id > ?`);
                                        queryParams.push(numValue);
                                        break;
                                    case '>=':
                                    case 'gte':
                                        whereConditions.push(`i.id >= ?`);
                                        queryParams.push(numValue);
                                        break;
                                    case '<':
                                    case 'lt':
                                        whereConditions.push(`i.id < ?`);
                                        queryParams.push(numValue);
                                        break;
                                    case '<=':
                                    case 'lte':
                                        whereConditions.push(`i.id <= ?`);
                                        queryParams.push(numValue);
                                        break;
                                }
                            }
                        } else {
                            // String fields
                            const strValue = `%${value}%`;
                            whereConditions.push(`i.${field} LIKE ?`);
                            queryParams.push(strValue);
                        }
                    }
                    filterIndex++;
                }
            }
            
            const whereClause = whereConditions.length > 0 
                ? whereConditions.join(' AND ') 
                : '';

            // Get total count with filters
            let countQuery = 'SELECT COUNT(*) as total FROM items i';
            if (whereClause) {
                countQuery += ` WHERE ${whereClause}`;
            }
            const [countResult] = await pool.execute(countQuery, queryParams) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Get items with categories (with filters)
            const [rows] = await pool.query(
                this.buildItemWithCategoriesQuery(whereClause, `i.${sortBy} ${sortOrder}`, limit, offset),
                queryParams
            );

            const items = (rows as any[]).map(row => {
                const converted = this.convertDatabaseValues(row);
                converted.category_ids = [];
                converted.categories_data = [];
                return converted;
            });

            // Явно завантажуємо категорії, щоб у відповіді були повні об'єкти
            const itemIds = items.map(item => item.id);
            const categoriesMap = await this.loadCategoriesForItems(itemIds);
            for (const item of items) {
                item.categories_data = categoriesMap.get(item.id) || [];
                item.category_ids = (item.categories_data as any[]).map((c: any) => c.id);
                (item as any).category_names = (item.categories_data as any[]).map((c: any) => c.ukr_name).join(', ');
                if (item.categories_data.length > 0 && !item.category_name) {
                    item.category_name = item.categories_data[0].ukr_name;
                }
            }

            return {
                items: items as WeaponItemResponse[],
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error in findAllWithCategories:', error);
            throw error;
        }
    }

    async findByIdWithCategories(id: number): Promise<WeaponItemResponse | null> {
        try {
            const [rows] = await pool.query(
                this.buildItemWithCategoriesQuery('i.id = ?'),
                [id]
            );

            const items = rows as any[];
            if (items.length === 0) {
                return null;
            }

            const converted = this.convertDatabaseValues(items[0]) as WeaponItemResponse;
            converted.categories_data = await this.getItemCategories(id);
            converted.category_ids = (converted.categories_data as any[]).map((c: any) => c.id);
            (converted as any).category_names = (converted.categories_data as any[]).map((c: any) => c.ukr_name).join(', ');
            if (converted.categories_data.length > 0 && !converted.category_name) {
                converted.category_name = converted.categories_data[0].ukr_name;
            }

            return converted;
        } catch (error) {
            console.error('Error in findByIdWithCategories:', error);
            throw error;
        }
    }

    /**
     * Створити новий запис зброї
     */
    async createWeaponItem(data: CreateWeaponItemDto): Promise<WeaponItemResponse> {
        try {
            const categoryIds = data.category_ids;

            // Видаляємо масив категорій перед базовим create, бо в таблиці items немає такої колонки
            const itemData = { ...data } as any;
            delete itemData.category_ids;

            // Визначаємо primary category_id для резервного поля items.category_id
            if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
                itemData.category_id = categoryIds[0];
            } else if (!itemData.category_id) {
                itemData.category_id = 1; // fallback
            }

            const created = await this.create(itemData);

            if (categoryIds) {
                await this.saveItemCategories(created.id, categoryIds, itemData.category_id);
            }

            const withCategories = await this.findByIdWithCategories(created.id);
            if (!withCategories) {
                throw new Error('Створений запис не знайдено');
            }

            return withCategories;
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
            const categoryIds = data.category_ids;

            // Видаляємо масив категорій перед базовим update
            const itemData = { ...data } as any;
            delete itemData.category_ids;

            // Якщо прийшов новий масив — синхронізуємо category_id в items
            if (categoryIds && Array.isArray(categoryIds)) {
                const uniqueIds = [...new Set(categoryIds.filter(id => Number.isInteger(id) && id > 0))];
                itemData.category_id = uniqueIds.length > 0 ? uniqueIds[0] : null;
            }

            const updated = await this.update(id, itemData);
            if (!updated) {
                return null;
            }

            if (categoryIds !== undefined) {
                await this.saveItemCategories(id, categoryIds, itemData.category_id);
            }

            return await this.findByIdWithCategories(id);
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
    async searchWithPagination(searchTerm: string, params: PaginationParams): Promise<PaginatedResponse<WeaponItemResponse>> {
        const {
            page = 1,
            limit = 20,
            sortBy = 'id',
            sortOrder = 'DESC'
        } = params;

        const offset = (page - 1) * limit;
        const searchPattern = `%${searchTerm}%`;

        try {
            // Get total count for search (including ID)
            const [countResult] = await pool.execute(
                `SELECT COUNT(*) as total FROM items 
                WHERE ukr_name LIKE ? OR eng_name LIKE ? OR rus_name LIKE ? OR CAST(id AS CHAR) LIKE ?`,
                [searchPattern, searchPattern, searchPattern, searchPattern]
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Get search results (including ID)
            const [rows] = await pool.query(
                this.buildItemWithCategoriesQuery(
                    'i.ukr_name LIKE ? OR i.eng_name LIKE ? OR i.rus_name LIKE ? OR CAST(i.id AS CHAR) LIKE ?',
                    `i.${sortBy} ${sortOrder}`,
                    limit,
                    offset
                ),
                [searchPattern, searchPattern, searchPattern, searchPattern]
            );

            const items = (rows as any[]).map(row => {
                const converted = this.convertDatabaseValues(row);
                converted.category_ids = [];
                return converted;
            });

            const itemIds = items.map(item => item.id);
            const categoriesMap = await this.loadCategoriesForItems(itemIds);
            for (const item of items) {
                item.categories_data = categoriesMap.get(item.id) || [];
                item.category_ids = (item.categories_data as any[]).map((c: any) => c.id);
                (item as any).category_names = (item.categories_data as any[]).map((c: any) => c.ukr_name).join(', ');
                if (item.categories_data.length > 0 && !item.category_name) {
                    item.category_name = item.categories_data[0].ukr_name;
                }
            }

            return {
                items: items as WeaponItemResponse[],
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

    async findByCategory(categoryId: number, params: PaginationParams, filterParams?: any): Promise<PaginatedResponse<WeaponItemResponse>> {
        const {
            page = 1,
            limit = 20,
            sortBy = 'id',
            sortOrder = 'DESC'
        } = params;

        const offset = (page - 1) * limit;

        try {
            // Build WHERE clause from filter params
            let whereConditions: string[] = [];
            let queryParams: any[] = [];
            
            // Base condition for category
            whereConditions.push('i.id IN (SELECT item_id FROM item_categories WHERE category_id = ?)');
            queryParams.push(categoryId);
            
            // Add filter conditions
            if (filterParams) {
                let filterIndex = 0;
                while (filterParams[`filterField${filterIndex > 0 ? filterIndex : ''}`]) {
                    const suffix = filterIndex > 0 ? `${filterIndex}` : '';
                    const field = filterParams[`filterField${suffix}`];
                    const operator = filterParams[`filterOperator${suffix}`];
                    const value = filterParams[`filterValue${suffix}`];
                    
                    if (field && operator && value !== undefined) {
                        // Special handling for ID field (numeric)
                        if (field === 'id') {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue)) {
                                // MUI DataGrid operators: =, !=, >, >=, <, <=
                                switch (operator) {
                                    case '=':
                                    case 'eq':
                                    case 'equals':
                                        whereConditions.push(`i.id = ?`);
                                        queryParams.push(numValue);
                                        break;
                                    case '!=':
                                    case 'notEq':
                                    case 'notEquals':
                                        whereConditions.push(`i.id != ?`);
                                        queryParams.push(numValue);
                                        break;
                                    case '>':
                                    case 'gt':
                                        whereConditions.push(`i.id > ?`);
                                        queryParams.push(numValue);
                                        break;
                                    case '>=':
                                    case 'gte':
                                        whereConditions.push(`i.id >= ?`);
                                        queryParams.push(numValue);
                                        break;
                                    case '<':
                                    case 'lt':
                                        whereConditions.push(`i.id < ?`);
                                        queryParams.push(numValue);
                                        break;
                                    case '<=':
                                    case 'lte':
                                        whereConditions.push(`i.id <= ?`);
                                        queryParams.push(numValue);
                                        break;
                                }
                            }
                        } else {
                            // String fields
                            const strValue = `%${value}%`;
                            whereConditions.push(`i.${field} LIKE ?`);
                            queryParams.push(strValue);
                        }
                    }
                    filterIndex++;
                }
            }
            
            const whereClause = whereConditions.join(' AND ');

            // Get total count for category with filters
            const [countResult] = await pool.execute(
                `SELECT COUNT(DISTINCT item_id) as total FROM item_categories ic 
                 JOIN items i ON i.id = ic.item_id 
                 WHERE ${whereClause}`,
                queryParams
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Get items for category via subselect to keep all item categories
            const [rows] = await pool.query(
                this.buildItemWithCategoriesQuery(
                    whereClause,
                    `i.${sortBy} ${sortOrder}`,
                    limit,
                    offset
                ),
                queryParams
            );

            const items = (rows as any[]).map(row => {
                const converted = this.convertDatabaseValues(row);
                converted.category_ids = [];
                return converted;
            });

            const itemIds = items.map(item => item.id);
            const categoriesMap = await this.loadCategoriesForItems(itemIds);
            for (const item of items) {
                item.categories_data = categoriesMap.get(item.id) || [];
                item.category_ids = (item.categories_data as any[]).map((c: any) => c.id);
                (item as any).category_names = (item.categories_data as any[]).map((c: any) => c.ukr_name).join(', ');
                if (item.categories_data.length > 0 && !item.category_name) {
                    item.category_name = item.categories_data[0].ukr_name;
                }
            }

            return {
                items: items as WeaponItemResponse[],
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
