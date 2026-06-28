/**
 * Конфігурація сутностей для грідів і форм
 */

import type { EntityType } from '../types/api.types';

// Локальні типи для конфігурації
export interface GridColumn {
    field: string;
    headerName: string;
    width?: number;
    editable?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'date';
    valueGetter?: (params: any) => any;
    valueFormatter?: (params: any) => string;
    renderCell?: (params: any) => any;
}

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'boolean';
    required?: boolean;
    maxLength?: number;
    options?: { value: any; label: string }[];
}

export interface EntityConfig {
    name: string;
    displayName: string;
    apiEndpoint: string;
    columns: GridColumn[];
    formFields: FormField[];
    useForm?: boolean; // true для items, false для інших (тільки грід)
    supportsInlineEditing?: boolean; // true для сутностей, які підтримують inline редагування
}

// ================= КОЛОНКИ ДЛЯ ГРІДІВ =================

const namedEntityColumns: GridColumn[] = [
    { field: 'id', headerName: 'ID', width: 80, type: 'number', valueFormatter: (params) => String(params.value) },
    { field: 'ukr', headerName: 'Українська', width: 200, editable: true, type: 'string' },
    { field: 'eng', headerName: 'English', width: 200, editable: true, type: 'string' },
    { field: 'rus', headerName: 'Москальська', width: 200, editable: true, type: 'string' }
];

const categoryColumns: GridColumn[] = [
    { field: 'id', headerName: 'ID', width: 80, type: 'number', valueFormatter: (params) => String(params.value) },
    { field: 'ukr_name', headerName: 'Українська назва', width: 250, editable: true, type: 'string' },
    { field: 'eng_name', headerName: 'English name', width: 250, editable: true, type: 'string' },
    { field: 'comments', headerName: 'Коментарі', width: 300, editable: true, type: 'string' }
];

const weaponColumns: GridColumn[] = [
    { field: 'id', headerName: 'ID', width: 58, type: 'number', valueFormatter: (params) => String(params.value) },
    { field: 'ready', headerName: 'Готовність', width: 100, type: 'boolean', editable: false },
    { field: 'ukr_name', headerName: 'Українська назва', width: 200, editable: false },
    { field: 'eng_name', headerName: 'English name', width: 200, editable: false },
    { field: 'rus_name', headerName: 'Москальська назва', width: 200, editable: false },
    { field: 'description_ukr', headerName: 'Опис українською', width: 180, editable: false },
    { field: 'description_eng', headerName: 'Description in English', width: 180, editable: false },
    { field: 'description_rus', headerName: 'Опис москальською', width: 300, editable: false },
    { field: 'total_len', headerName: 'Загальна довжина', width: 150, editable: false },
    { field: 'blade_len', headerName: 'Довжина клинка', width: 150, editable: false },
    { field: 'weight', headerName: 'Вага', width: 100, editable: false },
    { field: 'century', headerName: 'Століття', width: 120, editable: false },
    { field: 'theritory', headerName: 'Територія', width: 90, editable: false },
    {
        field: 'epoha_name',
        headerName: 'Епоха',
        width: 150,
        editable: false
    },
    {
        field: 'guard_type_name',
        headerName: 'Тип гарди',
        width: 150,
        editable: false
    },
    {
        field: 'blade_type_name',
        headerName: 'Тип клинка',
        width: 150,
        editable: false
    },
    {
        field: 'global_type_name',
        headerName: 'Глобальний тип',
        width: 150,
        editable: false
    },
    {
        field: 'dolls_name',
        headerName: 'Доли',
        width: 120,
        editable: false
    },
    {
        field: 'apple_name',
        headerName: 'Яблуко (навершя)',
        width: 150,
        editable: false
    },
    {
        field: 'usage_name',
        headerName: 'Використання',
        width: 150,
        editable: false
    },
    {
        field: 'sharpening_name',
        headerName: 'Заточення',
        width: 130,
        editable: false
    }
];

// ================= ПОЛЯ ДЛЯ ФОРМ =================

const namedEntityFormFields: FormField[] = [
    { name: 'ukr', label: 'Українська назва', type: 'text', maxLength: 100 },
    { name: 'eng', label: 'English name', type: 'text', maxLength: 100 },
    { name: 'rus', label: 'Москальська назва', type: 'text', maxLength: 100 }
];

const categoryFormFields: FormField[] = [
    { name: 'ukr_name', label: 'Українська назва', type: 'text', required: true, maxLength: 300 },
    { name: 'eng_name', label: 'English name', type: 'text', maxLength: 300 },
    { name: 'comments', label: 'Коментарі', type: 'textarea', maxLength: 500 }
];

const weaponFormFields: FormField[] = [
    // Основна інформація
    { name: 'ready', label: 'Готовність', type: 'boolean', required: true },
    { name: 'ukr_name', label: 'Українська назва', type: 'text', maxLength: 120 },
    { name: 'eng_name', label: 'English name', type: 'text', maxLength: 120 },
    { name: 'rus_name', label: 'Москальська назва', type: 'text', maxLength: 120 },

    // Описи
    { name: 'description_ukr', label: 'Опис українською', type: 'textarea', maxLength: 6300 },
    { name: 'description_eng', label: 'Description in English', type: 'textarea', maxLength: 6300 },
    { name: 'description_rus', label: 'Опис москальською', type: 'textarea', maxLength: 6300 },

    // Розміри
    { name: 'total_len', label: 'Загальна довжина', type: 'text', maxLength: 25 },
    { name: 'blade_len', label: 'Довжина клинка', type: 'text', maxLength: 25 },
    { name: 'handle_len', label: 'Довжина руків\'я', type: 'text', maxLength: 25 },
    { name: 'handle_len_w', label: 'Ширина руків\'я', type: 'text', maxLength: 10 },
    { name: 'width', label: 'Ширина клинка', type: 'text', maxLength: 25 },
    { name: 'guard_width', label: 'Ширина гарди', type: 'text', maxLength: 20 },
    { name: 'thikness', label: 'Товщина клинка', type: 'text', maxLength: 25 },
    { name: 'weight', label: 'Загальна вага', type: 'text', maxLength: 25 },

    // Історичні дані
    { name: 'theritory', label: 'Територія', type: 'text', maxLength: 100 },
    { name: 'century', label: 'Роки/Століття', type: 'text', maxLength: 25 },
    { name: 'arch_period', label: 'Археологічний період', type: 'text', maxLength: 50 },
    { name: 'epoha', label: 'Епоха', type: 'select', maxLength: 50 },

    // Типи та характеристики
    { name: 'global_type', label: 'Глобальний тип', type: 'select', maxLength: 20 },
    { name: 'guard_type', label: 'Тип гарди', type: 'select', maxLength: 20 },
    { name: 'blade_type', label: 'Тип клинка', type: 'select', maxLength: 20 },
    { name: 'dolls', label: 'Доли', type: 'select', maxLength: 10 },
    { name: 'apple', label: 'Яблуко (навершя)', type: 'select', maxLength: 20 },
    { name: 'using_it', label: 'Використання', type: 'select', maxLength: 50 },
    { name: 'sharpening', label: 'Заточення', type: 'select', maxLength: 10 },

    // Додаткова інформація
    { name: 'category_ids', label: 'Категорії', type: 'multiselect', required: true },
    { name: 'source', label: 'Джерело', type: 'textarea', maxLength: 800 },
    { name: 'links', label: 'Посилання', type: 'textarea', maxLength: 1500 },
    { name: 'comments', label: 'Коментарі', type: 'textarea', maxLength: 800 }
];

// ================= КОНФІГУРАЦІЯ СУТНОСТЕЙ =================

export const entitiesConfig: Record<EntityType, EntityConfig> = {
    'apple': {
        name: 'apple',
        displayName: 'Яблука (навершя)',
        apiEndpoint: '/apple',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false,
        supportsInlineEditing: true
    },

    'blade-type': {
        name: 'blade-type',
        displayName: 'Типи клинків',
        apiEndpoint: '/blade-type',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false,
        supportsInlineEditing: true
    },

    'dolls': {
        name: 'dolls',
        displayName: 'Доли',
        apiEndpoint: '/dolls',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false,
        supportsInlineEditing: true
    },

    'epoha': {
        name: 'epoha',
        displayName: 'Епохи',
        apiEndpoint: '/epoha',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false,
        supportsInlineEditing: true
    },

    'global-type': {
        name: 'global-type',
        displayName: 'Глобальні типи',
        apiEndpoint: '/global-type',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false,
        supportsInlineEditing: true
    },

    'guard-type': {
        name: 'guard-type',
        displayName: 'Типи гард',
        apiEndpoint: '/guard-type',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false,
        supportsInlineEditing: true
    },

    'sharpening': {
        name: 'sharpening',
        displayName: 'Заточення',
        apiEndpoint: '/sharpening',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false,
        supportsInlineEditing: true
    },

    'usage': {
        name: 'usage',
        displayName: 'Використання',
        apiEndpoint: '/usage',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false,
        supportsInlineEditing: true
    },

    'categories': {
        name: 'categories',
        displayName: 'Категорії',
        apiEndpoint: '/categories',
        columns: categoryColumns,
        formFields: categoryFormFields,
        useForm: false,
        supportsInlineEditing: true
    },

    'weapons': {
        name: 'weapons',
        displayName: 'Зброя',
        apiEndpoint: '/weapons',
        columns: weaponColumns,
        formFields: weaponFormFields,
        useForm: true // Для зброї використовуємо форми замість грід-редагування
    }
};

// ================= УТИЛІТНІ ФУНКЦІЇ =================

export const getEntityConfig = (entityType: EntityType): EntityConfig => {
    return entitiesConfig[entityType];
};

export const getEntityDisplayName = (entityType: EntityType): string => {
    return entitiesConfig[entityType].displayName;
};

export const getAllReferenceEntities = (): EntityType[] => {
    return [
        'apple',
        'blade-type',
        'dolls',
        'epoha',
        'global-type',
        'guard-type',
        'sharpening',
        'usage',
        'categories'
    ];
};

export const getGridEditableFields = (entityType: EntityType): string[] => {
    const config = entitiesConfig[entityType];
    return config.columns.filter(col => col.editable).map(col => col.field);
};

export const getRequiredFormFields = (entityType: EntityType): string[] => {
    const config = entitiesConfig[entityType];
    return config.formFields.filter(field => field.required).map(field => field.name);
};

// ================= КОНСТАНТИ =================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const SEARCH_MIN_LENGTH = 2;

// Заголовки для різних мов
export const LANGUAGE_HEADERS = {
    uk: 'Українська',
    en: 'English',
    ru: 'Русский'
} as const;

export type Language = keyof typeof LANGUAGE_HEADERS; 