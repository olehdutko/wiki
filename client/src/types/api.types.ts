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
    image_url?: string | null;
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

export interface Pommel extends NamedEntity { 
    type?: string | null;
    description?: string | null;
    rus?: string | null;
    image_url?: string | null;
}

export interface BladeType extends NamedEntity { }

export interface Dolls extends NamedEntity { }

export interface Epoha extends NamedEntity { }

export interface GlobalType extends NamedEntity { }

export interface GuardType extends NamedEntity { 
    image_url?: string | null;
}

export interface Sharpening extends NamedEntity { 
    image_url?: string | null;
}

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
    guard_width?: string | null;
    thikness?: string | null;
    weight?: string | null;
    // Imperial units (auto-calculated)
    total_len_in?: string | null;
    blade_len_in?: string | null;
    handle_len_in?: string | null;
    width_in?: string | null;
    guard_width_in?: string | null;
    thikness_in?: string | null;
    weight_lb?: string | null;
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
    pommel: string;
    links?: string | null;
    comments?: string | null;
    source: string;
    category_id: number;
    category_ids?: number[];
    // Додаткові поля для відображення назв
    category_name?: string | null;
    epoha_name?: string | null;
    guard_type_name?: string | null;
    blade_type_name?: string | null;
    global_type_name?: string | null;
    dolls_name?: string | null;
    usage_name?: string | null;
    sharpening_name?: string | null;
}

export interface WeaponItemResponse extends WeaponItem {
    category?: Category;
    epoha_data?: Epoha;
    guard_type_data?: GuardType;
    blade_type_data?: BladeType;
    global_type_data?: GlobalType;
    dolls_data?: Dolls;
    usage_data?: Usage;
    sharpening_data?: Sharpening;
}

// ================= DTO для створення/оновлення =================

export interface CreateWeaponItemDto extends Omit<WeaponItem, 'id' | 'category_name'> { }

export interface UpdateWeaponItemDto extends Partial<CreateWeaponItemDto> { }

export interface CreateCategoryDto extends Omit<Category, 'id'> { }

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> { }

export interface CreateNamedEntityDto extends Omit<NamedEntity, 'id'> { }

export interface UpdateNamedEntityDto extends Partial<CreateNamedEntityDto> { }

// ================= UNION TYPES для сутностей =================

export type EntityType =
    | 'pommel'
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
    | Pommel
    | BladeType
    | Category
    | Dolls
    | Epoha
    | GlobalType
    | GuardType
    | Sharpening
    | Usage
    | WeaponItem; 