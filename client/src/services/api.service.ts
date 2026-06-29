/**
 * API клієнт для взаємодії з backend
 */

import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
    EntityType,
    ApiResponse,
    PaginationParams,
    PaginatedResponse,
    BaseEntity,
    NamedEntity,
    Category,
    WeaponItemResponse,
    CreateWeaponItemDto,
    UpdateWeaponItemDto,
    CreateCategoryDto,
    UpdateCategoryDto,
    CreateNamedEntityDto,
    UpdateNamedEntityDto
} from '../types/api.types';

// ================= КОНФІГУРАЦІЯ API =================

const API_BASE_URL = '/api';


export interface ItemImage {
    id: number;
    item_id: number;
    file_name: string;
    is_primary: boolean;
    created_at: string;
    url?: string;
}

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Interceptors для обробки запитів та відповідей
        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor
        this.api.interceptors.request.use(
            (config) => {
                console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ API Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.api.interceptors.response.use(
            (response: AxiosResponse<ApiResponse>) => {
                console.log(`✅ API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                console.error('❌ API Response Error:', error.response?.data || error.message);

                // Обробка специфічних помилок
                if (error.response?.status === 401) {
                    // Можна додати логіку для redirect на login
                    console.warn('🔐 Unauthorized access');
                }

                return Promise.reject(error);
            }
        );
    }

    // ================= ЗАГАЛЬНІ CRUD МЕТОДИ =================

    /**
     * Отримати всі записи з пагінацією
     */
    async getAll<T extends BaseEntity>(
        endpoint: string,
        params?: PaginationParams
    ): Promise<PaginatedResponse<T>> {
        const response = await this.api.get<ApiResponse<PaginatedResponse<T>>>(endpoint, { params });
        console.log('🔍 API Response:', response.data);
        console.log('🔍 Items sample:', response.data.data?.items?.slice(0, 1));

        return response.data.data!;
    }

    /**
     * Отримати запис за ID
     */
    async getById<T extends BaseEntity>(endpoint: string, id: number): Promise<T | null> {
        try {
            const response = await this.api.get<ApiResponse<T>>(`${endpoint}/${id}`);
            return response.data.data || null;
        } catch (error: any) {
            if (error?.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Створити новий запис
     */
    async create<T extends BaseEntity, D = any>(endpoint: string, data: D): Promise<T> {
        const response = await this.api.post<ApiResponse<T>>(endpoint, data);
        return response.data.data!;
    }

    /**
     * Оновити запис
     */
    async update<T extends BaseEntity, D = any>(
        endpoint: string,
        id: number,
        data: D
    ): Promise<T | null> {
        try {
            console.log('🚀 PUT запит:', `${endpoint}/${id}`, data);
            const response = await this.api.put<ApiResponse<T>>(`${endpoint}/${id}`, data);
            console.log('✅ PUT відповідь:', response.data);
            return response.data.data || null;
        } catch (error: any) {
            console.error('❌ PUT помилка:', error);
            if (error?.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Видалити запис
     */
    async delete(endpoint: string, id: number): Promise<boolean> {
        try {
            await this.api.delete(`${endpoint}/${id}`);
            return true;
        } catch (error: any) {
            if (error?.response?.status === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Пошук записів
     */
    async search<T extends BaseEntity>(endpoint: string, query: string): Promise<T[]> {
        // Для зброї використовуємо спеціальний ендпоінт, який повертає пагіновані дані
        if (endpoint === '/weapons') {
            const response = await this.api.get<ApiResponse<PaginatedResponse<T>>>(`${endpoint}/search`, {
                params: { q: query, limit: 1000 } // Велика кількість для пошуку
            });
            return response.data.data?.items || [];
        }

        // Для інших сутностей використовуємо звичайний пошук
        const response = await this.api.get<ApiResponse<T[]>>(`${endpoint}/search`, {
            params: { q: query }
        });
        return response.data.data || [];
    }

    /**
     * Отримати кількість записів
     */
    async getCount(endpoint: string): Promise<number> {
        const response = await this.api.get<ApiResponse<{ count: number }>>(`${endpoint}/count`);
        return response.data.data?.count || 0;
    }

    // ================= СПЕЦИФІЧНІ МЕТОДИ ДЛЯ ДОВІДКОВИХ СУТНОСТЕЙ =================

    // Pommel
    async getAllPommel(params?: PaginationParams) {
        return this.getAll<NamedEntity>('/pommel', params);
    }

    async getPommelById(id: number) {
        return this.getById<NamedEntity>('/pommel', id);
    }

    async createPommel(data: CreateNamedEntityDto) {
        return this.create<NamedEntity>('/pommel', data);
    }

    async updatePommel(id: number, data: UpdateNamedEntityDto) {
        return this.update<NamedEntity>('/pommel', id, data);
    }

    async deletePommel(id: number) {
        return this.delete('/pommel', id);
    }

    async searchPommel(query: string) {
        return this.search<NamedEntity>('/pommel', query);
    }

    // Blade Types
    async getBladeTypes(params?: PaginationParams) {
        return this.getAll<NamedEntity>('/blade-type', params);
    }

    async getBladeTypeById(id: number) {
        return this.getById<NamedEntity>('/blade-type', id);
    }

    async createBladeType(data: CreateNamedEntityDto) {
        return this.create<NamedEntity>('/blade-type', data);
    }

    async updateBladeType(id: number, data: UpdateNamedEntityDto) {
        return this.update<NamedEntity>('/blade-type', id, data);
    }

    async deleteBladeType(id: number) {
        return this.delete('/blade-type', id);
    }

    // Categories
    async getCategories(params?: PaginationParams) {
        return this.getAll<Category>('/categories', params);
    }

    async getCategoryById(id: number) {
        return this.getById<Category>('/categories', id);
    }

    async createCategory(data: CreateCategoryDto) {
        return this.create<Category>('/categories', data);
    }

    async updateCategory(id: number, data: UpdateCategoryDto) {
        return this.update<Category>('/categories', id, data);
    }

    async deleteCategory(id: number) {
        return this.delete('/categories', id);
    }

    async searchCategories(query: string) {
        return this.search<Category>('/categories', query);
    }

    async getAllCategories() {
        return this.getAll<Category>('/categories', { limit: 1000 }); // Отримуємо всі категорії
    }

    // Epoha
    async getAllEpoha() {
        return this.getAll<NamedEntity>('/epoha', { limit: 1000 });
    }

    // Guard Types
    async getAllGuardTypes() {
        return this.getAll<NamedEntity>('/guard-type', { limit: 1000 });
    }

    // Blade Types
    async getAllBladeTypes() {
        return this.getAll<NamedEntity>('/blade-type', { limit: 1000 });
    }

    // Dolls
    async getAllDolls() {
        return this.getAll<NamedEntity>('/dolls', { limit: 1000 });
    }

    // Usage
    async getAllUsage() {
        return this.getAll<NamedEntity>('/usage', { limit: 1000 });
    }

    // Apple
    async getAllApple() {
        return this.getAll<NamedEntity>('/pommel', { limit: 1000 });
    }

    // Sharpening
    async getAllSharpening() {
        return this.getAll<NamedEntity>('/sharpening', { limit: 1000 });
    }

    // Global Type
    async getAllGlobalTypes() {
        return this.getAll<NamedEntity>('/global-type', { limit: 1000 });
    }

    // Weapons (головна сутність)
    async getWeapons(params?: PaginationParams) {
        return this.getAll<WeaponItemResponse>('/weapons', params);
    }

    async getWeaponById(id: number) {
        return this.getById<WeaponItemResponse>('/weapons', id);
    }

    async createWeapon(data: CreateWeaponItemDto) {
        return this.create<WeaponItemResponse>('/weapons', data);
    }

    async updateWeapon(id: number, data: UpdateWeaponItemDto) {
        return this.update<WeaponItemResponse>('/weapons', id, data);
    }

    async deleteWeapon(id: number) {
        return this.delete('/weapons', id);
    }

    async searchWeapons(query: string, params?: PaginationParams) {
        const response = await this.api.get<ApiResponse<PaginatedResponse<WeaponItemResponse>>>(
            '/weapons/search',
            { params: { q: query, ...params } }
        );
        return response.data.data!;
    }

    async getWeaponsByCategory(categoryId: number, params?: PaginationParams) {
        return this.getAll<WeaponItemResponse>(`/weapons/category/${categoryId}`, params);
    }

    // ================= УНІВЕРСАЛЬНІ МЕТОДИ ДЛЯ ДОВІДКОВИХ СУТНОСТЕЙ =================

    /**
     * Універсальний метод для роботи з довідковими сутностями
     */
    async getEntityData<T extends BaseEntity>(entityType: EntityType, params?: PaginationParams) {
        const endpoint = this.getEndpointByEntityType(entityType);
        return this.getAll<T>(endpoint, params);
    }

    async createEntity<T extends BaseEntity>(entityType: EntityType, data: any) {
        const endpoint = this.getEndpointByEntityType(entityType);
        return this.create<T>(endpoint, data);
    }

    async updateEntity<T extends BaseEntity>(entityType: EntityType, id: number, data: any) {
        const endpoint = this.getEndpointByEntityType(entityType);
        console.log('🔄 updateEntity викликано:', { entityType, id, data, endpoint });
        const result = await this.update<T>(endpoint, id, data);
        console.log('✅ updateEntity результат:', result);
        return result;
    }

    async deleteEntity(entityType: EntityType, id: number) {
        const endpoint = this.getEndpointByEntityType(entityType);
        return this.delete(endpoint, id);
    }

    async getMaxId(entityType: EntityType): Promise<number> {
        const endpoint = this.getEndpointByEntityType(entityType);
        try {
            const response = await this.api.get<ApiResponse<{ maxId: number }>>(`${endpoint}/max-id`);
            return response.data.data?.maxId || 0;
        } catch (error) {
            console.error('❌ Помилка отримання максимального ID:', error);
            return 0;
        }
    }

    private getEndpointByEntityType(entityType: EntityType): string {
        const endpointMap: Record<EntityType, string> = {
            'pommel': '/pommel',
            'blade-type': '/blade-type',
            'categories': '/categories',
            'dolls': '/dolls',
            'epoha': '/epoha',
            'global-type': '/global-type',
            'guard-type': '/guard-type',
            'sharpening': '/sharpening',
            'usage': '/usage',
            'weapons': '/weapons'
        };

        return endpointMap[entityType];
    }

    // ================= МЕТОДИ ДЛЯ ПОШУКУ ЗВ'ЯЗКІВ =================

    /**
     * Отримати пов'язані об'єкти для заданого ID
     */
    async getLinkedObjects(itemId: number) {
        try {
            const response = await this.api.get<ApiResponse<Array<{
                id: number;
                ukr_name: string;
                eng_name: string;
                rus_name: string;
            }>>>(`/links/${itemId}`);

            console.log('API відповідь для пов\'язаних об\'єктів:', {
                success: response.data.success,
                dataType: typeof response.data.data,
                isArray: Array.isArray(response.data.data),
                data: response.data.data
            });

            return response.data.data || [];
        } catch (error) {
            console.error('❌ Помилка отримання пов\'язаних об\'єктів:', error);
            return [];
        }
    }

    /**
     * Видалити лінк за ID
     */
    async deleteLink(linkId: number): Promise<boolean> {
        try {
            const response = await this.api.delete<ApiResponse>(`/links/${linkId}`);
            return response.data.success;
        } catch (error) {
            console.error('❌ Помилка видалення лінка:', error);
            return false;
        }
    }

    // ================= ЗДОРОВ'Я API =================

    async checkHealth() {
        try {
            const response = await this.api.get<ApiResponse>('/health');
            return response.data.success;
        } catch {
            return false;
        }
    }

    async getApiInfo() {
        const response = await this.api.get<ApiResponse>('/info');
        return response.data.data;
    }

    /**
     * Завантажити повний SQL-дамп БД (mysqldump на сервері).
     * Якщо на сервері задано DUMP_SECRET, у .env клієнта має бути VITE_DUMP_SECRET з тим самим значенням.
     */
    async downloadDatabaseDump(): Promise<void> {
        const headers: Record<string, string> = {};
        const secret = import.meta.env.VITE_DUMP_SECRET;
        if (typeof secret === 'string' && secret.length > 0) {
            headers['X-Dump-Secret'] = secret;
        }

        const response = await fetch('/api/database/dump', { method: 'GET', headers });

        if (!response.ok) {
            let msg = response.statusText;
            try {
                const j = (await response.json()) as { message?: string };
                if (j.message) msg = j.message;
            } catch {
                /* ignore */
            }
            throw new Error(msg);
        }

        const blob = await response.blob();
        let filename = `weaponry_full_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
        const cd = response.headers.get('Content-Disposition');
        if (cd) {
            const m = /filename="([^"]+)"/.exec(cd) || /filename=([^;\s]+)/.exec(cd);
            if (m) filename = decodeURIComponent(m[1].replace(/"/g, ''));
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // ================= UPLOAD ЗОБРАЖЕНЬ =================

    /**
     * Завантажити зображення для довідкової сутності
     */
    async uploadEntityImage(entityType: string, entityId: number, file: File): Promise<{ imageUrl: string }> {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`/api/upload/${entityType}/${entityId}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload image');
        }

        const result = await response.json();
        return result.data;
    }

    /**
     * Видалити зображення довідкової сутності
     */
    async deleteEntityImage(entityType: string, entityId: number): Promise<void> {
        const response = await this.api.delete(`/upload/${entityType}/${entityId}`);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete image');
        }
    }

    // ================= LINKS (ЗВ'ЯЗКИ МІЖ АЙТЕМАМИ) =================

    /**
     * Створити зв'язок між айтемами
     */
    async createLink(itemId: number, otherItemId: number): Promise<{ id: number; item_id: number; other_item: number }> {
        try {
            const response = await this.api.post<ApiResponse<{ id: number; item_id: number; other_item: number }>>('/links', {
                item_id: itemId,
                other_item: otherItemId
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to create link');
            }

            return response.data.data!;
        } catch (error: any) {
            console.error('❌ Помилка створення зв\'язку:', error);
            throw error;
        }
    }

    /**
     * Пошук айтемів для додавання зв'язку
     */
    async searchItems(query: string): Promise<Array<{
        id: number;
        ukr_name: string;
        eng_name: string;
        rus_name: string;
    }>> {
        try {
            const response = await this.api.get<ApiResponse<Array<{
                id: number;
                ukr_name: string;
                eng_name: string;
                rus_name: string;
            }>>>('/items/search', {
                params: { q: query }
            });

            return response.data.data || [];
        } catch (error) {
            console.error('❌ Помилка пошуку айтемів:', error);
            return [];
        }
    }
    // ================= ITEM IMAGES (ГАЛЕРЕЯ ЗОБРАЖЕНЬ АЙТЕМІВ) =================

    /**
     * Отримати список зображень айтема
     */
    async getItemImages(itemId: number): Promise<{ id: number; item_id: number; file_name: string; is_primary: boolean; created_at: string; url?: string }[]> {
        try {
            const response = await this.api.get<ApiResponse<{ id: number; item_id: number; file_name: string; is_primary: boolean; created_at: string; url?: string }[]>>(`/items/${itemId}/images`);
            return response.data.data || [];
        } catch (error) {
            console.error('❌ Помилка отримання зображень айтема:', error);
            return [];
        }
    }

    /**
     * Завантажити зображення для айтема
     */
    async uploadItemImages(itemId: number, files: File[]): Promise<{ id: number; item_id: number; file_name: string; is_primary: boolean; created_at: string; url?: string }[]> {
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('images', file);
            });

            const response = await this.api.post<ApiResponse<{ id: number; item_id: number; file_name: string; is_primary: boolean; created_at: string; url?: string }[]>>(`/items/${itemId}/images`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data.data || [];
        } catch (error: any) {
            console.error('❌ Помилка завантаження зображень:', error);
            throw error;
        }
    }

    /**
     * Встановити primary зображення
     */
    async setPrimaryItemImage(itemId: number, imageId: number): Promise<void> {
        try {
            await this.api.patch<ApiResponse<void>>(`/items/${itemId}/images/${imageId}/primary`);
        } catch (error: any) {
            console.error('❌ Помилка встановлення primary зображення:', error);
            throw error;
        }
    }

    /**
     * Видалити зображення айтема
     */
    async deleteItemImage(itemId: number, imageId: number): Promise<void> {
        try {
            await this.api.delete<ApiResponse<void>>(`/items/${itemId}/images/${imageId}`);
        } catch (error: any) {
            console.error('❌ Помилка видалення зображення:', error);
            throw error;
        }
    }
}

// Експорт singleton instance
export const apiService = new ApiService();
export default apiService; 