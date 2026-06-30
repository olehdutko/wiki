/**
 * Спеціалізовані сервіси для всіх сутностей
 */

import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { BaseService } from './base.service';
import { pool } from '../config/database.config';
import { getItemImageUrl, ItemImagesService } from './itemImages.service';

// ================= UTILITY FUNCTIONS FOR UNIT CONVERSION =================

/**
 * Конвертує міліметри в дюйми
 * 1 inch = 25.4 mm
 */
export function mmToInches(mm: string | number | null | undefined): string | null {
    if (!mm || mm === '' || mm === '0') return null;
    const mmValue = typeof mm === 'string' ? parseFloat(mm.replace(',', '.')) : mm;
    if (isNaN(mmValue) || mmValue === 0) return null;
    const inches = mmValue / 25.4;
    // Округляємо до 2 знаків після коми
    return inches.toFixed(2).replace(/\.00$/, '');
}

/**
 * Конвертує грами в фунти
 * 1 lb = 453.59237 g
 */
export function gramsToPounds(grams: string | number | null | undefined): string | null {
    if (!grams || grams === '' || grams === '0') return null;
    const gValue = typeof grams === 'string' ? parseFloat(grams.replace(',', '.')) : grams;
    if (isNaN(gValue) || gValue === 0) return null;
    const pounds = gValue / 453.59237;
    // Округляємо до 2 знаків після коми
    return pounds.toFixed(2).replace(/\.00$/, '');
}

/**
 * Додає імперські одиниці до даних сутності
 */
export function addImperialUnits(data: any): any {
    if (!data) return data;
    
    // Конвертуємо довжини (mm → inches)
    if (data.totalLen !== undefined) data.totalLenIn = mmToInches(data.totalLen);
    if (data.bladeLen !== undefined) data.bladeLenIn = mmToInches(data.bladeLen);
    if (data.handleLen !== undefined) data.handleLenIn = mmToInches(data.handleLen);
    if (data.width !== undefined) data.widthIn = mmToInches(data.width);
    if (data.guardWidth !== undefined) data.guardWidthIn = mmToInches(data.guardWidth);
    if (data.thikness !== undefined) data.thiknessIn = mmToInches(data.thikness);
    
    // Конвертуємо вагу (grams → pounds)
    if (data.weight !== undefined) data.weightLb = gramsToPounds(data.weight);
    
    return data;
}
import {
    Pommel, BladeType, Category, Territory, Dolls, Epoha, GlobalType, GuardType,
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

export class PommelService extends BaseService<Pommel> {
    constructor() {
        super('pommel');
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

// ================= СЕРВІС ТЕРИТОРІЙ =================

export class TerritoryService extends BaseService<Territory> {
    constructor() {
        super('territory');
    }

    /**
     * Пошук територій за українською назвою
     */
    async search(searchTerm: string): Promise<Territory[]> {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM \`${this.tableName}\` WHERE ukr_name LIKE ? ORDER BY ukr_name`,
                [`%${searchTerm}%`]
            ) as [RowDataPacket[], any];

            return rows as Territory[];
        } catch (error) {
            console.error(`Помилка при пошуку територій:`, error);
            throw new Error('Не вдалося виконати пошук територій');
        }
    }

    /**
     * Знайти або створити територію за українською назвою
     */
    async findOrCreateByUkrName(ukrName: string): Promise<Territory> {
        const trimmed = ukrName.trim();
        if (!trimmed) {
            throw new Error('Назва території не може бути порожньою');
        }

        try {
            const [existing] = await pool.execute(
                `SELECT * FROM \`${this.tableName}\` WHERE ukr_name = ?`,
                [trimmed]
            ) as [RowDataPacket[], any];

            if (existing.length > 0) {
                return existing[0] as Territory;
            }

            const [result] = await pool.execute(
                `INSERT INTO \`${this.tableName}\` (ukr_name) VALUES (?)`,
                [trimmed]
            ) as [ResultSetHeader, any];

            const created = await this.findById(result.insertId);
            if (!created) {
                throw new Error('Не вдалося створити територію');
            }
            return created;
        } catch (error) {
            console.error(`Помилка при пошуку/створенні території:`, error);
            throw new Error('Не вдалося обробити територію');
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
     * Load primary image URLs for a list of items
     */
    private async loadPrimaryImagesForItems(itemIds: number[]): Promise<Map<number, string>> {
        if (itemIds.length === 0) {
            return new Map();
        }

        const imageService = new ItemImagesService();
        return await imageService.getPrimaryImagesForItems(itemIds);
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
     * Отримати території для списку айтемів
     */
    private async loadTerritoriesForItems(itemIds: number[]): Promise<Map<number, Territory[]>> {
        if (itemIds.length === 0) {
            return new Map();
        }

        const placeholders = itemIds.map(() => '?').join(',');
        const [rows] = await pool.execute(
            `SELECT it.item_id, it.territory_id, t.ukr_name, t.eng_name, t.rus_name
             FROM item_territories it
             JOIN territory t ON it.territory_id = t.id
             WHERE it.item_id IN (${placeholders})
             ORDER BY t.ukr_name`,
            itemIds
        ) as [RowDataPacket[], any];

        const result = new Map<number, Territory[]>();
        for (const row of rows) {
            const territory: Territory = {
                id: row.territory_id,
                ukr_name: row.ukr_name,
                eng_name: row.eng_name,
                rus_name: row.rus_name
            };

            if (!result.has(row.item_id)) {
                result.set(row.item_id, []);
            }
            result.get(row.item_id)!.push(territory);
        }

        return result;
    }

    /**
     * Зберегти зв’язки територій для айтема.
     * territoryIds може містити існуючі ID (number) або нові назви (string).
     * Для рядків створюємо новий запис у territory.
     */
    private async saveItemTerritories(itemId: number, territoryIds: (number | string)[] | undefined): Promise<Territory[]> {
        if (!territoryIds || !Array.isArray(territoryIds)) {
            return this.getItemTerritories(itemId);
        }

        const territoryService = new TerritoryService();
        const resolvedIds: number[] = [];

        for (const value of territoryIds) {
            if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
                resolvedIds.push(value);
            } else if (typeof value === 'string' && value.trim()) {
                const territory = await territoryService.findOrCreateByUkrName(value.trim());
                resolvedIds.push(territory.id);
            }
        }

        const uniqueIds = [...new Set(resolvedIds)];
        if (uniqueIds.length === 0) {
            await pool.execute('DELETE FROM item_territories WHERE item_id = ?', [itemId]);
            return [];
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute('DELETE FROM item_territories WHERE item_id = ?', [itemId]);

            const values = uniqueIds.map((territoryId) => [itemId, territoryId]);
            await connection.query(
                `INSERT INTO item_territories (item_id, territory_id) VALUES ?`,
                [values]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        return this.getItemTerritories(itemId);
    }

    /**
     * Отримати території конкретного айтема
     */
    private async getItemTerritories(itemId: number): Promise<Territory[]> {
        const [rows] = await pool.execute(
            `SELECT it.territory_id, t.ukr_name, t.eng_name, t.rus_name
             FROM item_territories it
             JOIN territory t ON it.territory_id = t.id
             WHERE it.item_id = ?
             ORDER BY t.ukr_name`,
            [itemId]
        ) as [RowDataPacket[], any];

        return rows.map((row: any) => ({
            id: row.territory_id,
            ukr_name: row.ukr_name,
            eng_name: row.eng_name,
            rus_name: row.rus_name
        })) as Territory[];
    }

    /**
     * Мапа колонок гріду, які показують українську назву довідкової сутності,
     * на справжнє поле в таблиці items та назву довідкової таблиці.
     */
    private static escapeIdentifier(name: string): string {
        return `\`${name.replace(/`/g, '``')}\``;
    }

    private static readonly REFERENCE_NAME_FIELDS: Record<string, { itemField: string; refTable: string }> = {
        'epoha_name': { itemField: 'epoha', refTable: 'epoha' },
        'guard_type_name': { itemField: 'guard_type', refTable: 'guard_type' },
        'blade_type_name': { itemField: 'blade_type', refTable: 'blade_type' },
        'global_type_name': { itemField: 'global_type', refTable: 'global_type' },
        'dolls_name': { itemField: 'dolls', refTable: 'dolls' },
        'pommel_name': { itemField: 'pommel', refTable: 'pommel' },
        'usage_name': { itemField: 'using_it', refTable: 'usage' },
        'sharpening_name': { itemField: 'sharpening', refTable: 'sharpening' }
    };

    /**
     * Допоміжний метод для отримання items з опціональним фільтром.
     * Не використовує GROUP_CONCAT для категорій, щоб уникнути втрати категорій
     * при фільтрації по одній з них.
     */
    /**
     * Постійні LEFT JOIN з довідковими таблицями, щоб мати українські назви
     * для відображення в гріді зброї.
     */
    private static readonly REFERENCE_DISPLAY_JOINS = [
        { field: 'epoha', table: 'epoha', displayColumn: 'epoha_name' },
        { field: 'guard_type', table: 'guard_type', displayColumn: 'guard_type_name' },
        { field: 'blade_type', table: 'blade_type', displayColumn: 'blade_type_name' },
        { field: 'global_type', table: 'global_type', displayColumn: 'global_type_name' },
        { field: 'dolls', table: 'dolls', displayColumn: 'dolls_name' },
        { field: 'pommel', table: 'pommel', displayColumn: 'pommel_name' },
        { field: 'using_it', table: 'usage', displayColumn: 'usage_name' },
        { field: 'sharpening', table: 'sharpening', displayColumn: 'sharpening_name' }
    ];

    private buildItemWithCategoriesQuery(whereClause = '', orderBy = 'i.id', joins: string[] = [], limit?: number, offset?: number): string {
        const displayJoins = WeaponItemService.REFERENCE_DISPLAY_JOINS.map(j => {
            const alias = `ref_${j.field}`;
            return `LEFT JOIN ${WeaponItemService.escapeIdentifier(j.table)} ${alias} ON i.${j.field} = ${alias}.id`;
        });
        // Уникаємо дублювання alias, якщо фільтр вже додав JOIN з тією ж довідковою таблицею.
        const seenAliases = new Set<string>();
        const allJoins: string[] = [];
        for (const join of [...displayJoins, ...joins]) {
            const match = join.match(/\s+(ref_\w+)\s+ON\s/i);
            const alias = match ? match[1] : join;
            if (seenAliases.has(alias)) continue;
            seenAliases.add(alias);
            allJoins.push(join);
        }
        const joinClause = allJoins.length > 0 ? ' ' + allJoins.join(' ') : '';

        const displayColumns = WeaponItemService.REFERENCE_DISPLAY_JOINS
            .map(j => `ref_${j.field}.ukr as ${j.displayColumn}`)
            .join(', ');
        const selectColumns = displayColumns ? `i.*, ${displayColumns}` : 'i.*';

        let sql = `SELECT ${selectColumns} FROM items i${joinClause}`;

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
            
            const joins: string[] = [];
            let forceEmptyResult = false;

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
                        } else if (WeaponItemService.REFERENCE_NAME_FIELDS[field]) {
                            const mapping = WeaponItemService.REFERENCE_NAME_FIELDS[field];
                            const alias = `ref_${mapping.itemField}`;
                            if (!joins.some(j => j.includes(` ${alias} `) || j.endsWith(` ${alias}`))) {
                                joins.push(`LEFT JOIN ${WeaponItemService.escapeIdentifier(mapping.refTable)} ${alias} ON i.${mapping.itemField} = ${alias}.id`);
                            }
                            const strValue = `%${value}%`;
                            whereConditions.push(`${alias}.ukr LIKE ?`);
                            queryParams.push(strValue);
                        } else {
                            // String fields
                            if (operator === '=' || operator === 'eq' || operator === 'equals') {
                                whereConditions.push(`i.${field} = ?`);
                                queryParams.push(value);
                            } else {
                                const strValue = `%${value}%`;
                                whereConditions.push(`i.${field} LIKE ?`);
                                queryParams.push(strValue);
                            }
                        }
                    }
                    filterIndex++;
                }
            }

            if (forceEmptyResult) {
                return {
                    items: [],
                    total: 0,
                    page,
                    limit,
                    totalPages: 0
                };
            }
            
            const whereClause = whereConditions.length > 0 
                ? whereConditions.join(' AND ') 
                : '';

            // Get total count with filters
            let countQuery = 'SELECT COUNT(DISTINCT i.id) as total FROM items i';
            if (joins.length > 0) {
                countQuery += ' ' + joins.join(' ');
            }
            if (whereClause) {
                countQuery += ` WHERE ${whereClause}`;
            }
            const [countResult] = await pool.execute(countQuery, queryParams) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Get items with categories (with filters)
            const [rows] = await pool.query(
                this.buildItemWithCategoriesQuery(whereClause, `i.${sortBy} ${sortOrder}`, joins, limit, offset),
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
            const territoriesMap = await this.loadTerritoriesForItems(itemIds);
            const primaryImagesMap = await this.loadPrimaryImagesForItems(itemIds);
            for (const item of items) {
                item.categories_data = categoriesMap.get(item.id) || [];
                item.category_ids = (item.categories_data as any[]).map((c: any) => c.id);
                (item as any).category_names = (item.categories_data as any[]).map((c: any) => c.ukr_name).join(', ');
                if (item.categories_data.length > 0 && !item.category_name) {
                    item.category_name = item.categories_data[0].ukr_name;
                }
                item.territories_data = territoriesMap.get(item.id) || [];
                item.territory_ids = (item.territories_data as any[]).map((t: any) => t.id);
                const primaryFileName = primaryImagesMap.get(item.id);
                if (primaryFileName) {
                    (item as any).primary_image_url = getItemImageUrl(item, primaryFileName);
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
                this.buildItemWithCategoriesQuery('i.id = ?', 'i.id', []),
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
            converted.territories_data = await this.getItemTerritories(id);
            converted.territory_ids = (converted.territories_data as any[]).map((t: any) => t.id);

            const imageService = new ItemImagesService();
            const primaryFileName = await imageService.getPrimaryImageForItem(id);
            if (primaryFileName) {
                (converted as any).primary_image_url = getItemImageUrl(converted, primaryFileName);
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
            
            // Автоматично додаємо імперські одиниці
            itemData.total_len_in = mmToInches(itemData.total_len);
            itemData.blade_len_in = mmToInches(itemData.blade_len);
            itemData.handle_len_in = mmToInches(itemData.handle_len);
            // handle_len_w_in - опціонально, може не бути в БД
            if (itemData.handle_len_w) {
                itemData.handle_len_w_in = mmToInches(itemData.handle_len_w);
            }
            itemData.width_in = mmToInches(itemData.width);
            itemData.guard_width_in = mmToInches(itemData.guard_width);
            itemData.thikness_in = mmToInches(itemData.thikness);
            itemData.weight_lb = gramsToPounds(itemData.weight);

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

            const territoryIds = data.territory_ids;
            delete itemData.territory_ids;
            if (territoryIds !== undefined) {
                await this.saveItemTerritories(created.id, territoryIds);
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
            
            // Автоматично додаємо імперські одиниці
            itemData.total_len_in = mmToInches(itemData.total_len);
            itemData.blade_len_in = mmToInches(itemData.blade_len);
            itemData.handle_len_in = mmToInches(itemData.handle_len);
            // handle_len_w_in - опціонально, може не бути в БД
            if (itemData.handle_len_w) {
                itemData.handle_len_w_in = mmToInches(itemData.handle_len_w);
            }
            itemData.width_in = mmToInches(itemData.width);
            itemData.guard_width_in = mmToInches(itemData.guard_width);
            itemData.thikness_in = mmToInches(itemData.thikness);
            itemData.weight_lb = gramsToPounds(itemData.weight);
            
            // Автоматично додаємо імперські одиниці
            itemData.total_len_in = mmToInches(itemData.total_len);
            itemData.blade_len_in = mmToInches(itemData.blade_len);
            itemData.handle_len_in = mmToInches(itemData.handle_len);
            // handle_len_w_in - опціонально, може не бути в БД
            if (itemData.handle_len_w) {
                itemData.handle_len_w_in = mmToInches(itemData.handle_len_w);
            }
            itemData.width_in = mmToInches(itemData.width);
            itemData.guard_width_in = mmToInches(itemData.guard_width);
            itemData.thikness_in = mmToInches(itemData.thikness);
            itemData.weight_lb = gramsToPounds(itemData.weight);

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

            const territoryIds = data.territory_ids;
            delete itemData.territory_ids;
            if (territoryIds !== undefined) {
                await this.saveItemTerritories(id, territoryIds);
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
                    [],
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
            const territoriesMap = await this.loadTerritoriesForItems(itemIds);
            const primaryImagesMap = await this.loadPrimaryImagesForItems(itemIds);
            for (const item of items) {
                item.categories_data = categoriesMap.get(item.id) || [];
                item.category_ids = (item.categories_data as any[]).map((c: any) => c.id);
                (item as any).category_names = (item.categories_data as any[]).map((c: any) => c.ukr_name).join(', ');
                if (item.categories_data.length > 0 && !item.category_name) {
                    item.category_name = item.categories_data[0].ukr_name;
                }
                item.territories_data = territoriesMap.get(item.id) || [];
                item.territory_ids = (item.territories_data as any[]).map((t: any) => t.id);
                const primaryFileName = primaryImagesMap.get(item.id);
                if (primaryFileName) {
                    (item as any).primary_image_url = getItemImageUrl(item, primaryFileName);
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
            const joins: string[] = [];
            let forceEmptyResult = false;

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
                        } else if (WeaponItemService.REFERENCE_NAME_FIELDS[field]) {
                            const mapping = WeaponItemService.REFERENCE_NAME_FIELDS[field];
                            const alias = `ref_${mapping.itemField}`;
                            if (!joins.some(j => j.includes(` ${alias} `) || j.endsWith(` ${alias}`))) {
                                joins.push(`LEFT JOIN ${WeaponItemService.escapeIdentifier(mapping.refTable)} ${alias} ON i.${mapping.itemField} = ${alias}.id`);
                            }
                            const strValue = `%${value}%`;
                            whereConditions.push(`${alias}.ukr LIKE ?`);
                            queryParams.push(strValue);
                        } else {
                            // String fields
                            if (operator === '=' || operator === 'eq' || operator === 'equals') {
                                whereConditions.push(`i.${field} = ?`);
                                queryParams.push(value);
                            } else {
                                const strValue = `%${value}%`;
                                whereConditions.push(`i.${field} LIKE ?`);
                                queryParams.push(strValue);
                            }
                        }
                    }
                    filterIndex++;
                }
            }

            if (forceEmptyResult) {
                return {
                    items: [],
                    total: 0,
                    page,
                    limit,
                    totalPages: 0
                };
            }
            
            const whereClause = whereConditions.join(' AND ');

            // Get total count for category with filters
            const joinClause = joins.length > 0 ? ' ' + joins.join(' ') : '';
            const [countResult] = await pool.execute(
                `SELECT COUNT(DISTINCT ic.item_id) as total FROM item_categories ic 
                 JOIN items i ON i.id = ic.item_id${joinClause} 
                 WHERE ${whereClause}`,
                queryParams
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Get items for category via subselect to keep all item categories
            const [rows] = await pool.query(
                this.buildItemWithCategoriesQuery(
                    whereClause,
                    `i.${sortBy} ${sortOrder}`,
                    joins,
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
            const territoriesMap = await this.loadTerritoriesForItems(itemIds);
            const primaryImagesMap = await this.loadPrimaryImagesForItems(itemIds);
            for (const item of items) {
                item.categories_data = categoriesMap.get(item.id) || [];
                item.category_ids = (item.categories_data as any[]).map((c: any) => c.id);
                (item as any).category_names = (item.categories_data as any[]).map((c: any) => c.ukr_name).join(', ');
                if (item.categories_data.length > 0 && !item.category_name) {
                    item.category_name = item.categories_data[0].ukr_name;
                }
                item.territories_data = territoriesMap.get(item.id) || [];
                item.territory_ids = (item.territories_data as any[]).map((t: any) => t.id);
                const primaryFileName = primaryImagesMap.get(item.id);
                if (primaryFileName) {
                    (item as any).primary_image_url = getItemImageUrl(item, primaryFileName);
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
                case 'pommel':
                    this.instances.set(entityName, new PommelService());
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
