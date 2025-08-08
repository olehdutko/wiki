/**
 * TypeScript типи для API клієнту
 */

// ================= БАЗОВІ ТИПИ =================

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

// ================= СУТНОСТІ =================

export interface Apple extends NamedEntity { }

export interface BladeType extends NamedEntity { }

export interface Dolls extends NamedEntity { }

export interface Epoha extends NamedEntity { }

export interface GlobalType extends NamedEntity { }

export interface GuardType extends NamedEntity { }

export interface Sharpening extends NamedEntity { }

export interface Usage extends NamedEntity { }

export interface Category extends BaseEntity {
    ukr_name: string;
    eng_name: string;
    comments: string;
}

export interface WeaponItem extends BaseEntity {
    ready: boolean;
    description_ukr?: string | null;
    description_eng?: string | null;
    description_rus?: string | null;
    ukr_name?: string | null;
    eng_name?: string | null;
    rus_name?: string | null;
    handle_len?: string | null;
    handle_len_w: string;
    total_len?: string | null;
    blade_len?: string | null;
    width?: string | null;
    guard_width: string;
    thikness?: string | null;
    weight?: string | null;
    theritory?: string | null;
    century?: string | null;
    arch_period?: string | null;
    epoha?: string | null;
    guard_type?: string | null;
    blade_type?: string | null;
    global_type: string;
    dolls?: string | null;
    using_it?: string | null;
    sharpening?: string | null;
    apple: string;
    links?: string | null;
    comments?: string | null;
    source: string;
    category_id: number;
}

export interface WeaponItemResponse extends WeaponItem {
    category?: Category;
    epoha_data?: Epoha;
    guard_type_data?: GuardType;
    blade_type_data?: BladeType;
    dolls_data?: Dolls;
    usage_data?: Usage;
    sharpening_data?: Sharpening;
}

// ================= DTO для створення/оновлення =================

export interface CreateWeaponItemDto extends Omit<WeaponItem, 'id'> { }

export interface UpdateWeaponItemDto extends Partial<CreateWeaponItemDto> { }

export interface CreateCategoryDto extends Omit<Category, 'id'> { }

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> { }

export interface CreateNamedEntityDto extends Omit<NamedEntity, 'id'> { }

export interface UpdateNamedEntityDto extends Partial<CreateNamedEntityDto> { }

// ================= UNION TYPES для сутностей =================

export type EntityType = 
    | 'apple'
    | 'blade-type'
    | 'categories'
    | 'dolls'
    | 'epoha'
    | 'global-type'
    | 'guard-type'
    | 'sharpening'
    | 'usage'
    | 'weapons';

// ================= НАЛАШТУВАННЯ ЗАСТОСУНКУ =================

export interface AppSettings {
    apiBaseUrl: string;
    defaultPageSize: number;
    maxPageSize: number;
    theme: 'light' | 'dark';
    language: 'uk' | 'en' | 'ru';
}

// ================= ТИПИ ДЛЯ СТАНУ ЗАСТОСУНКУ =================

export interface LoadingState {
    loading: boolean;
    error?: string | null;
}

export interface NotificationState {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    id: string;
    duration?: number;
}

// ================= UTILITIES =================

export type EntityUnion =
    | Apple
    | BladeType
    | Category
    | Dolls
    | Epoha
    | GlobalType
    | GuardType
    | Sharpening
    | Usage
    | WeaponItem; 