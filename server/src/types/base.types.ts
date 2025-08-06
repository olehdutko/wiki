/**
 * Базові типи для проекту енциклопедії холодної зброї
 */

export interface BaseEntity {
    id: number;
}

export interface NamedEntity extends BaseEntity {
    ukr?: string | null;
    eng?: string | null;
    rus?: string | null;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export type SortOrder = 'ASC' | 'DESC';

export interface DatabaseConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
}

// Enum для статусів операцій
export enum OperationStatus {
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info'
}

// Базовий тип для валідації
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
} 