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
    WeaponItem,
    WeaponItemResponse,
    CreateWeaponItemDto,
    UpdateWeaponItemDto,
    CreateCategoryDto,
    UpdateCategoryDto,
    CreateNamedEntityDto,
    UpdateNamedEntityDto
} from '../types/api.types';

// ================= КОНФІГУРАЦІЯ API =================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
            const response = await this.api.put<ApiResponse<T>>(`${endpoint}/${id}`, data);
            return response.data.data || null;
        } catch (error: any) {
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

    // Apple
    async getApples(params?: PaginationParams) {
        return this.getAll<NamedEntity>('/apple', params);
    }

    async getAppleById(id: number) {
        return this.getById<NamedEntity>('/apple', id);
    }

    async createApple(data: CreateNamedEntityDto) {
        return this.create<NamedEntity>('/apple', data);
    }

    async updateApple(id: number, data: UpdateNamedEntityDto) {
        return this.update<NamedEntity>('/apple', id, data);
    }

    async deleteApple(id: number) {
        return this.delete('/apple', id);
    }

    async searchApples(query: string) {
        return this.search<NamedEntity>('/apple', query);
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
        return this.update<T>(endpoint, id, data);
    }

    async deleteEntity(entityType: EntityType, id: number) {
        const endpoint = this.getEndpointByEntityType(entityType);
        return this.delete(endpoint, id);
    }

    private getEndpointByEntityType(entityType: EntityType): string {
        const endpointMap: Record<EntityType, string> = {
            'apple': '/apple',
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
}

// Експорт singleton instance
export const apiService = new ApiService();
export default apiService; 