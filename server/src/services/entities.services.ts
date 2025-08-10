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
                `SELECT COUNT(*) as total FROM \`${this.tableName}\``
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Отримання записів з інформацією про всі пов'язані таблиці
            const [rows] = await pool.execute(
                `SELECT i.*, 
                    c.ukr_name as category_ukr_name, c.eng_name as category_eng_name, c.comments as category_comments,
                    e.ukr as epoha_ukr, e.eng as epoha_eng, e.rus as epoha_rus,
                    gt.ukr as guard_type_ukr, gt.eng as guard_type_eng, gt.rus as guard_type_rus,
                    bt.ukr as blade_type_ukr, bt.eng as blade_type_eng, bt.rus as blade_type_rus,
                    glt.ukr as global_type_ukr, glt.eng as global_type_eng, glt.rus as global_type_rus,
                    d.ukr as dolls_ukr, d.eng as dolls_eng, d.rus as dolls_rus,
                    u.ukr as usage_ukr, u.eng as usage_eng, u.rus as usage_rus,
                    s.ukr as sharpening_ukr, s.eng as sharpening_eng, s.rus as sharpening_rus,
                    e.ukr as epoha_name,
                    gt.ukr as guard_type_name,
                    bt.ukr as blade_type_name,
                    glt.ukr as global_type_name,
                    d.ukr as dolls_name,
                    u.ukr as usage_name,
                    s.ukr as sharpening_name
                 FROM items i
                 LEFT JOIN categories c ON i.category_id = c.id
                 LEFT JOIN epoha e ON CAST(i.epoha AS UNSIGNED) = e.id AND i.epoha != '' AND i.epoha IS NOT NULL
                 LEFT JOIN guard_type gt ON CAST(i.guard_type AS UNSIGNED) = gt.id AND i.guard_type != '' AND i.guard_type IS NOT NULL
                 LEFT JOIN blade_type bt ON CAST(i.blade_type AS UNSIGNED) = bt.id AND i.blade_type != '' AND i.blade_type IS NOT NULL
                 LEFT JOIN global_type glt ON CAST(i.global_type AS UNSIGNED) = glt.id AND i.global_type != '' AND i.global_type IS NOT NULL
                 LEFT JOIN dolls d ON CAST(i.dolls AS UNSIGNED) = d.id AND i.dolls != '' AND i.dolls IS NOT NULL
                 LEFT JOIN \`usage\` u ON CAST(i.using_it AS UNSIGNED) = u.id AND i.using_it != '' AND i.using_it IS NOT NULL
                 LEFT JOIN sharpening s ON CAST(i.sharpening AS UNSIGNED) = s.id AND i.sharpening != '' AND i.sharpening IS NOT NULL
                 ORDER BY i.${sortBy} ${sortOrder}
                 LIMIT ${limit} OFFSET ${offset}`
            ) as [RowDataPacket[], any];

            // Трансформуємо результат для включення інформації про всі пов'язані таблиці
            const items: WeaponItemResponse[] = rows.map((row: any) => {
                const {
                    category_ukr_name, category_eng_name, category_comments,
                    epoha_ukr, epoha_eng, epoha_rus,
                    guard_type_ukr, guard_type_eng, guard_type_rus,
                    blade_type_ukr, blade_type_eng, blade_type_rus,
                    global_type_ukr, global_type_eng, global_type_rus,
                    dolls_ukr, dolls_eng, dolls_rus,
                    usage_ukr, usage_eng, usage_rus,
                    sharpening_ukr, sharpening_eng, sharpening_rus,
                    ...itemData
                } = row;

                // Конвертуємо boolean поля
                const convertedItemData = this.convertDatabaseValues(itemData);

                return {
                    ...convertedItemData,
                    category: category_ukr_name ? {
                        id: itemData.category_id,
                        ukr_name: category_ukr_name,
                        eng_name: category_eng_name,
                        comments: category_comments
                    } : undefined,
                    epoha_data: epoha_ukr ? {
                        id: parseInt(itemData.epoha) || null,
                        ukr: epoha_ukr,
                        eng: epoha_eng,
                        rus: epoha_rus
                    } : undefined,
                    guard_type_data: guard_type_ukr ? {
                        id: parseInt(itemData.guard_type) || null,
                        ukr: guard_type_ukr,
                        eng: guard_type_eng,
                        rus: guard_type_rus
                    } : undefined,
                    blade_type_data: blade_type_ukr ? {
                        id: parseInt(itemData.blade_type) || null,
                        ukr: blade_type_ukr,
                        eng: blade_type_eng,
                        rus: blade_type_rus
                    } : undefined,
                    global_type_data: global_type_ukr ? {
                        id: parseInt(itemData.global_type) || null,
                        ukr: global_type_ukr,
                        eng: global_type_eng,
                        rus: global_type_rus
                    } : undefined,
                    dolls_data: dolls_ukr ? {
                        id: parseInt(itemData.dolls) || null,
                        ukr: dolls_ukr,
                        eng: dolls_eng,
                        rus: dolls_rus
                    } : undefined,
                    usage_data: usage_ukr ? {
                        id: parseInt(itemData.using_it) || null,
                        ukr: usage_ukr,
                        eng: usage_eng,
                        rus: usage_rus
                    } : undefined,
                    sharpening_data: sharpening_ukr ? {
                        id: parseInt(itemData.sharpening) || null,
                        ukr: sharpening_ukr,
                        eng: sharpening_eng,
                        rus: sharpening_rus
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
                `SELECT i.*, 
                    c.ukr_name as category_ukr_name, c.eng_name as category_eng_name, c.comments as category_comments,
                    e.ukr as epoha_ukr, e.eng as epoha_eng, e.rus as epoha_rus,
                    gt.ukr as guard_type_ukr, gt.eng as guard_type_eng, gt.rus as guard_type_rus,
                    bt.ukr as blade_type_ukr, bt.eng as blade_type_eng, bt.rus as blade_type_rus,
                    glt.ukr as global_type_ukr, glt.eng as global_type_eng, glt.rus as global_type_rus,
                    d.ukr as dolls_ukr, d.eng as dolls_eng, d.rus as dolls_rus,
                    u.ukr as usage_ukr, u.eng as usage_eng, u.rus as usage_rus,
                    s.ukr as sharpening_ukr, s.eng as sharpening_eng, s.rus as sharpening_rus,
                    e.ukr as epoha_name,
                    gt.ukr as guard_type_name,
                    bt.ukr as blade_type_name,
                    glt.ukr as global_type_name,
                    d.ukr as dolls_name,
                    u.ukr as usage_name,
                    s.ukr as sharpening_name
                 FROM items i
                 LEFT JOIN categories c ON i.category_id = c.id
                 LEFT JOIN epoha e ON CAST(i.epoha AS UNSIGNED) = e.id AND i.epoha != '' AND i.epoha IS NOT NULL
                 LEFT JOIN guard_type gt ON CAST(i.guard_type AS UNSIGNED) = gt.id AND i.guard_type != '' AND i.guard_type IS NOT NULL
                 LEFT JOIN blade_type bt ON CAST(i.blade_type AS UNSIGNED) = bt.id AND i.blade_type != '' AND i.blade_type IS NOT NULL
                 LEFT JOIN global_type glt ON CAST(i.global_type AS UNSIGNED) = glt.id AND i.global_type != '' AND i.global_type IS NOT NULL
                 LEFT JOIN dolls d ON CAST(i.dolls AS UNSIGNED) = d.id AND i.dolls != '' AND i.dolls IS NOT NULL
                 LEFT JOIN \`usage\` u ON CAST(i.using_it AS UNSIGNED) = u.id AND i.using_it != '' AND i.using_it IS NOT NULL
                 LEFT JOIN sharpening s ON CAST(i.sharpening AS UNSIGNED) = s.id AND i.sharpening != '' AND i.sharpening IS NOT NULL
                 WHERE i.id = ?`,
                [id]
            ) as [RowDataPacket[], any];

            if (rows.length === 0) {
                return null;
            }

            const row = rows[0];
            const {
                category_ukr_name, category_eng_name, category_comments,
                epoha_ukr, epoha_eng, epoha_rus,
                guard_type_ukr, guard_type_eng, guard_type_rus,
                blade_type_ukr, blade_type_eng, blade_type_rus,
                global_type_ukr, global_type_eng, global_type_rus,
                dolls_ukr, dolls_eng, dolls_rus,
                usage_ukr, usage_eng, usage_rus,
                sharpening_ukr, sharpening_eng, sharpening_rus,
                ...itemData
            } = row;

            // Конвертуємо boolean поля
            const convertedItemData = this.convertDatabaseValues(itemData);

            return {
                ...convertedItemData,
                category: category_ukr_name ? {
                    id: itemData.category_id,
                    ukr_name: category_ukr_name,
                    eng_name: category_eng_name,
                    comments: category_comments
                } : undefined,
                epoha_data: epoha_ukr ? {
                    id: parseInt(itemData.epoha) || null,
                    ukr: epoha_ukr,
                    eng: epoha_eng,
                    rus: epoha_rus
                } : undefined,
                guard_type_data: guard_type_ukr ? {
                    id: parseInt(itemData.guard_type) || null,
                    ukr: guard_type_ukr,
                    eng: guard_type_eng,
                    rus: guard_type_rus
                } : undefined,
                blade_type_data: blade_type_ukr ? {
                    id: parseInt(itemData.blade_type) || null,
                    ukr: blade_type_ukr,
                    eng: blade_type_eng,
                    rus: blade_type_rus
                } : undefined,
                global_type_data: global_type_ukr ? {
                    id: parseInt(itemData.global_type) || null,
                    ukr: global_type_ukr,
                    eng: global_type_eng,
                    rus: global_type_rus
                } : undefined,
                dolls_data: dolls_ukr ? {
                    id: parseInt(itemData.dolls) || null,
                    ukr: dolls_ukr,
                    eng: dolls_eng,
                    rus: dolls_rus
                } : undefined,
                usage_data: usage_ukr ? {
                    id: parseInt(itemData.using_it) || null,
                    ukr: usage_ukr,
                    eng: usage_eng,
                    rus: usage_rus
                } : undefined,
                sharpening_data: sharpening_ukr ? {
                    id: parseInt(itemData.sharpening) || null,
                    ukr: sharpening_ukr,
                    eng: sharpening_eng,
                    rus: sharpening_rus
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
                `SELECT COUNT(*) as total FROM \`items\` i
         WHERE i.ukr_name LIKE ? OR i.eng_name LIKE ? OR i.rus_name LIKE ?`,
                [searchPattern, searchPattern, searchPattern]
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Отримання записів з інформацією про всі пов'язані таблиці
            const [rows] = await pool.execute(
                `SELECT i.*, 
                    c.ukr_name as category_ukr_name, c.eng_name as category_eng_name, c.comments as category_comments,
                    e.ukr as epoha_ukr, e.eng as epoha_eng, e.rus as epoha_rus,
                    gt.ukr as guard_type_ukr, gt.eng as guard_type_eng, gt.rus as guard_type_rus,
                    bt.ukr as blade_type_ukr, bt.eng as blade_type_eng, bt.rus as blade_type_rus,
                    glt.ukr as global_type_ukr, glt.eng as global_type_eng, glt.rus as global_type_rus,
                    d.ukr as dolls_ukr, d.eng as dolls_eng, d.rus as dolls_rus,
                    u.ukr as usage_ukr, u.eng as usage_eng, u.rus as usage_rus,
                    s.ukr as sharpening_ukr, s.eng as sharpening_eng, s.rus as sharpening_rus,
                    e.ukr as epoha_name,
                    gt.ukr as guard_type_name,
                    bt.ukr as blade_type_name,
                    glt.ukr as global_type_name,
                    d.ukr as dolls_name,
                    u.ukr as usage_name,
                    s.ukr as sharpening_name
                 FROM items i
                 LEFT JOIN categories c ON i.category_id = c.id
                 LEFT JOIN epoha e ON CAST(i.epoha AS UNSIGNED) = e.id AND i.epoha != '' AND i.epoha IS NOT NULL
                 LEFT JOIN guard_type gt ON CAST(i.guard_type AS UNSIGNED) = gt.id AND i.guard_type != '' AND i.guard_type IS NOT NULL
                 LEFT JOIN blade_type bt ON CAST(i.blade_type AS UNSIGNED) = bt.id AND i.blade_type != '' AND i.blade_type IS NOT NULL
                 LEFT JOIN global_type glt ON CAST(i.global_type AS UNSIGNED) = glt.id AND i.global_type != '' AND i.global_type IS NOT NULL
                 LEFT JOIN dolls d ON CAST(i.dolls AS UNSIGNED) = d.id AND i.dolls != '' AND i.dolls IS NOT NULL
                 LEFT JOIN \`usage\` u ON CAST(i.using_it AS UNSIGNED) = u.id AND i.using_it != '' AND i.using_it IS NOT NULL
                 LEFT JOIN sharpening s ON CAST(i.sharpening AS UNSIGNED) = s.id AND i.sharpening != '' AND i.sharpening IS NOT NULL
                 WHERE i.ukr_name LIKE ? OR i.eng_name LIKE ? OR i.rus_name LIKE ?
                 ORDER BY i.${sortBy} ${sortOrder}
                 LIMIT ${limit} OFFSET ${offset}`,
                [searchPattern, searchPattern, searchPattern]
            ) as [RowDataPacket[], any];

            // Трансформуємо результат для включення інформації про всі пов'язані таблиці
            const items: WeaponItemResponse[] = rows.map((row: any) => {
                const {
                    category_ukr_name, category_eng_name, category_comments,
                    epoha_ukr, epoha_eng, epoha_rus,
                    guard_type_ukr, guard_type_eng, guard_type_rus,
                    blade_type_ukr, blade_type_eng, blade_type_rus,
                    global_type_ukr, global_type_eng, global_type_rus,
                    dolls_ukr, dolls_eng, dolls_rus,
                    usage_ukr, usage_eng, usage_rus,
                    sharpening_ukr, sharpening_eng, sharpening_rus,
                    ...itemData
                } = row;

                // Конвертуємо boolean поля
                const convertedItemData = this.convertDatabaseValues(itemData);

                return {
                    ...convertedItemData,
                    category: category_ukr_name ? {
                        id: itemData.category_id,
                        ukr_name: category_ukr_name,
                        eng_name: category_eng_name,
                        comments: category_comments
                    } : undefined,
                    epoha_data: epoha_ukr ? {
                        id: parseInt(itemData.epoha) || null,
                        ukr: epoha_ukr,
                        eng: epoha_eng,
                        rus: epoha_rus
                    } : undefined,
                    guard_type_data: guard_type_ukr ? {
                        id: parseInt(itemData.guard_type) || null,
                        ukr: guard_type_ukr,
                        eng: guard_type_eng,
                        rus: guard_type_rus
                    } : undefined,
                    blade_type_data: blade_type_ukr ? {
                        id: parseInt(itemData.blade_type) || null,
                        ukr: blade_type_ukr,
                        eng: blade_type_eng,
                        rus: blade_type_rus
                    } : undefined,
                    global_type_data: global_type_ukr ? {
                        id: parseInt(itemData.global_type) || null,
                        ukr: global_type_ukr,
                        eng: global_type_eng,
                        rus: global_type_rus
                    } : undefined,
                    dolls_data: dolls_ukr ? {
                        id: parseInt(itemData.dolls) || null,
                        ukr: dolls_ukr,
                        eng: dolls_eng,
                        rus: dolls_rus
                    } : undefined,
                    usage_data: usage_ukr ? {
                        id: parseInt(itemData.using_it) || null,
                        ukr: usage_ukr,
                        eng: usage_eng,
                        rus: usage_rus
                    } : undefined,
                    sharpening_data: sharpening_ukr ? {
                        id: parseInt(itemData.sharpening) || null,
                        ukr: sharpening_ukr,
                        eng: sharpening_eng,
                        rus: sharpening_rus
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
                `SELECT COUNT(*) as total FROM \`items\` WHERE category_id = ?`,
                [categoryId]
            ) as [RowDataPacket[], any];

            const total = countResult[0].total;

            // Отримання записів з інформацією про всі пов'язані таблиці
            const [rows] = await pool.execute(
                `SELECT i.*, 
                    c.ukr_name as category_ukr_name, c.eng_name as category_eng_name, c.comments as category_comments,
                    e.ukr as epoha_ukr, e.eng as epoha_eng, e.rus as epoha_rus,
                    gt.ukr as guard_type_ukr, gt.eng as guard_type_eng, gt.rus as guard_type_rus,
                    bt.ukr as blade_type_ukr, bt.eng as blade_type_eng, bt.rus as blade_type_rus,
                    glt.ukr as global_type_ukr, glt.eng as global_type_eng, glt.rus as global_type_rus,
                    d.ukr as dolls_ukr, d.eng as dolls_eng, d.rus as dolls_rus,
                    u.ukr as usage_ukr, u.eng as usage_eng, u.rus as usage_rus,
                    s.ukr as sharpening_ukr, s.eng as sharpening_eng, s.rus as sharpening_rus,
                    e.ukr as epoha_name,
                    gt.ukr as guard_type_name,
                    bt.ukr as blade_type_name,
                    glt.ukr as global_type_name,
                    d.ukr as dolls_name,
                    u.ukr as usage_name,
                    s.ukr as sharpening_name
                 FROM items i
                 LEFT JOIN categories c ON i.category_id = c.id
                 LEFT JOIN epoha e ON CAST(i.epoha AS UNSIGNED) = e.id AND i.epoha != '' AND i.epoha IS NOT NULL
                 LEFT JOIN guard_type gt ON CAST(i.guard_type AS UNSIGNED) = gt.id AND i.guard_type != '' AND i.guard_type IS NOT NULL
                 LEFT JOIN blade_type bt ON CAST(i.blade_type AS UNSIGNED) = bt.id AND i.blade_type != '' AND i.blade_type IS NOT NULL
                 LEFT JOIN global_type glt ON CAST(i.global_type AS UNSIGNED) = glt.id AND i.global_type != '' AND i.global_type IS NOT NULL
                 LEFT JOIN dolls d ON CAST(i.dolls AS UNSIGNED) = d.id AND i.dolls != '' AND i.dolls IS NOT NULL
                 LEFT JOIN \`usage\` u ON CAST(i.using_it AS UNSIGNED) = u.id AND i.using_it != '' AND i.using_it IS NOT NULL
                 LEFT JOIN sharpening s ON CAST(i.sharpening AS UNSIGNED) = s.id AND i.sharpening != '' AND i.sharpening IS NOT NULL
                 WHERE i.category_id = ?
                 ORDER BY i.${sortBy} ${sortOrder}
                 LIMIT ${limit} OFFSET ${offset}`,
                [categoryId]
            ) as [RowDataPacket[], any];

            // Трансформуємо результат для включення інформації про всі пов'язані таблиці
            const items: WeaponItemResponse[] = rows.map((row: any) => {
                const {
                    category_ukr_name, category_eng_name, category_comments,
                    epoha_ukr, epoha_eng, epoha_rus,
                    guard_type_ukr, guard_type_eng, guard_type_rus,
                    blade_type_ukr, blade_type_eng, blade_type_rus,
                    global_type_ukr, global_type_eng, global_type_rus,
                    dolls_ukr, dolls_eng, dolls_rus,
                    usage_ukr, usage_eng, usage_rus,
                    sharpening_ukr, sharpening_eng, sharpening_rus,
                    ...itemData
                } = row;

                // Конвертуємо boolean поля
                const convertedItemData = this.convertDatabaseValues(itemData);

                return {
                    ...convertedItemData,
                    category: category_ukr_name ? {
                        id: itemData.category_id,
                        ukr_name: category_ukr_name,
                        eng_name: category_eng_name,
                        comments: category_comments
                    } : undefined,
                    epoha_data: epoha_ukr ? {
                        id: parseInt(itemData.epoha) || null,
                        ukr: epoha_ukr,
                        eng: epoha_eng,
                        rus: epoha_rus
                    } : undefined,
                    guard_type_data: guard_type_ukr ? {
                        id: parseInt(itemData.guard_type) || null,
                        ukr: guard_type_ukr,
                        eng: guard_type_eng,
                        rus: guard_type_rus
                    } : undefined,
                    blade_type_data: blade_type_ukr ? {
                        id: parseInt(itemData.blade_type) || null,
                        ukr: blade_type_ukr,
                        eng: blade_type_eng,
                        rus: blade_type_rus
                    } : undefined,
                    global_type_data: global_type_ukr ? {
                        id: parseInt(itemData.global_type) || null,
                        ukr: global_type_ukr,
                        eng: global_type_eng,
                        rus: global_type_rus
                    } : undefined,
                    dolls_data: dolls_ukr ? {
                        id: parseInt(itemData.dolls) || null,
                        ukr: dolls_ukr,
                        eng: dolls_eng,
                        rus: dolls_rus
                    } : undefined,
                    usage_data: usage_ukr ? {
                        id: parseInt(itemData.using_it) || null,
                        ukr: usage_ukr,
                        eng: usage_eng,
                        rus: usage_rus
                    } : undefined,
                    sharpening_data: sharpening_ukr ? {
                        id: parseInt(itemData.sharpening) || null,
                        ukr: sharpening_ukr,
                        eng: sharpening_eng,
                        rus: sharpening_rus
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