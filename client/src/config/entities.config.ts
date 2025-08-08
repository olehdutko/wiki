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
    renderCell?: (params: any) => any;
}

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'number' | 'boolean';
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
}

// ================= КОЛОНКИ ДЛЯ ГРІДІВ =================

const namedEntityColumns: GridColumn[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'ukr', headerName: 'Українська', width: 200, editable: true },
    { field: 'eng', headerName: 'English', width: 200, editable: true },
    { field: 'rus', headerName: 'Русский', width: 200, editable: true }
];

const categoryColumns: GridColumn[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'ukr_name', headerName: 'Українська назва', width: 250, editable: true },
    { field: 'eng_name', headerName: 'English name', width: 250, editable: true },
    { field: 'comments', headerName: 'Коментарі', width: 300, editable: true }
];

const weaponColumns: GridColumn[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'ready', headerName: 'Готовність', width: 100, type: 'boolean', editable: false },
    { field: 'ukr_name', headerName: 'Українська назва', width: 200, editable: false },
    { field: 'eng_name', headerName: 'English name', width: 200, editable: false },
    { field: 'rus_name', headerName: 'Російська назва', width: 200, editable: false },
        { field: 'description_ukr', headerName: 'Опис українською', width: 300, editable: false },
    { field: 'description_eng', headerName: 'Description in English', width: 300, editable: false },
    { field: 'description_rus', headerName: 'Описание на русском', width: 300, editable: false },
    { field: 'total_len', headerName: 'Загальна довжина', width: 150, editable: false },
    { field: 'blade_len', headerName: 'Довжина клинка', width: 150, editable: false },
    { field: 'weight', headerName: 'Вага', width: 100, editable: false },
    { field: 'century', headerName: 'Століття', width: 120, editable: false },
    { field: 'theritory', headerName: 'Територія', width: 150, editable: false },
    {
        field: 'category_name',
        headerName: 'Категорія',
        width: 200,
        editable: false,

    },
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
        field: 'dolls_name',
        headerName: 'Доли',
        width: 120,
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
    { name: 'rus', label: 'Русское название', type: 'text', maxLength: 100 }
];

const categoryFormFields: FormField[] = [
    { name: 'ukr_name', label: 'Українська назва', type: 'text', required: true, maxLength: 300 },
    { name: 'eng_name', label: 'English name', type: 'text', required: true, maxLength: 300 },
    { name: 'comments', label: 'Коментарі', type: 'textarea', required: true, maxLength: 500 }
];

const weaponFormFields: FormField[] = [
    // Основна інформація
    { name: 'ready', label: 'Готовність', type: 'boolean', required: true },
    { name: 'ukr_name', label: 'Українська назва', type: 'text', maxLength: 120 },
    { name: 'eng_name', label: 'English name', type: 'text', maxLength: 120 },
    { name: 'rus_name', label: 'Русское название', type: 'text', maxLength: 120 },

    // Описи
    { name: 'description_ukr', label: 'Опис українською', type: 'textarea', maxLength: 6300 },
    { name: 'description_eng', label: 'Description in English', type: 'textarea', maxLength: 6300 },
    { name: 'description_rus', label: 'Описание на русском', type: 'textarea', maxLength: 6300 },

    // Розміри
    { name: 'total_len', label: 'Загальна довжина', type: 'text', maxLength: 25 },
    { name: 'blade_len', label: 'Довжина клинка', type: 'text', maxLength: 25 },
    { name: 'handle_len', label: 'Довжина руків\'я', type: 'text', maxLength: 25 },
    { name: 'handle_len_w', label: 'Ширина руків\'я', type: 'text', required: true, maxLength: 10 },
    { name: 'width', label: 'Ширина', type: 'text', maxLength: 25 },
    { name: 'guard_width', label: 'Ширина гарди', type: 'text', required: true, maxLength: 20 },
    { name: 'thikness', label: 'Товщина', type: 'text', maxLength: 25 },
    { name: 'weight', label: 'Вага', type: 'text', maxLength: 25 },

    // Історичні дані
    { name: 'theritory', label: 'Територія', type: 'text', maxLength: 100 },
    { name: 'century', label: 'Століття', type: 'text', maxLength: 25 },
    { name: 'arch_period', label: 'Археологічний період', type: 'text', maxLength: 50 },
    { name: 'epoha', label: 'Епоха', type: 'text', maxLength: 50 },

    // Типи та характеристики
    { name: 'global_type', label: 'Глобальний тип', type: 'text', required: true, maxLength: 20 },
    { name: 'guard_type', label: 'Тип гарди', type: 'text', maxLength: 20 },
    { name: 'blade_type', label: 'Тип клинка', type: 'text', maxLength: 20 },
    { name: 'dolls', label: 'Доли', type: 'text', maxLength: 10 },
    { name: 'apple', label: 'Яблуко (навершя)', type: 'text', required: true, maxLength: 10 },
    { name: 'using_it', label: 'Використання', type: 'text', maxLength: 50 },
    { name: 'sharpening', label: 'Заточення', type: 'text', maxLength: 10 },

    // Додаткова інформація
    { name: 'category_id', label: 'Категорія', type: 'select', required: true },
    { name: 'source', label: 'Джерело', type: 'text', required: true, maxLength: 500 },
    { name: 'links', label: 'Посилання', type: 'textarea', maxLength: 750 },
    { name: 'comments', label: 'Коментарі', type: 'textarea', maxLength: 750 }
];

// ================= КОНФІГУРАЦІЯ СУТНОСТЕЙ =================

export const entitiesConfig: Record<EntityType, EntityConfig> = {
    'apple': {
        name: 'apple',
        displayName: 'Яблука (навершя)',
        apiEndpoint: '/apple',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false
    },

    'blade-type': {
        name: 'blade-type',
        displayName: 'Типи клинків',
        apiEndpoint: '/blade-type',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false
    },

    'dolls': {
        name: 'dolls',
        displayName: 'Доли',
        apiEndpoint: '/dolls',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false
    },

    'epoha': {
        name: 'epoha',
        displayName: 'Епохи',
        apiEndpoint: '/epoha',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false
    },

    'global-type': {
        name: 'global-type',
        displayName: 'Глобальні типи',
        apiEndpoint: '/global-type',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false
    },

    'guard-type': {
        name: 'guard-type',
        displayName: 'Типи гард',
        apiEndpoint: '/guard-type',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false
    },

    'sharpening': {
        name: 'sharpening',
        displayName: 'Заточення',
        apiEndpoint: '/sharpening',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false
    },

    'usage': {
        name: 'usage',
        displayName: 'Використання',
        apiEndpoint: '/usage',
        columns: namedEntityColumns,
        formFields: namedEntityFormFields,
        useForm: false
    },

    'categories': {
        name: 'categories',
        displayName: 'Категорії',
        apiEndpoint: '/categories',
        columns: categoryColumns,
        formFields: categoryFormFields,
        useForm: false
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