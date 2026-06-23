/**
 * Моделі сутностей для енциклопедії холодної зброї
 */

import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength } from 'class-validator';
import { BaseEntity, NamedEntity } from '../types/base.types';

// ================= ДОВІДКОВІ СУТНОСТІ =================

export class Apple implements NamedEntity {
    @IsNumber()
    id!: number;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    ukr?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    eng?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    rus?: string | null;
}

export class BladeType implements NamedEntity {
    @IsNumber()
    id!: number;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    ukr?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    eng?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    rus?: string | null;
}

export class Dolls implements NamedEntity {
    @IsNumber()
    id!: number;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    ukr?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    eng?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    rus?: string | null;
}

export class Epoha implements NamedEntity {
    @IsNumber()
    id!: number;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    ukr?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    eng?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    rus?: string | null;
}

export class GlobalType implements NamedEntity {
    @IsNumber()
    id!: number;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    ukr?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    eng?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    rus?: string | null;
}

export class GuardType implements NamedEntity {
    @IsNumber()
    id!: number;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    ukr?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    eng?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    rus?: string | null;
}

export class Sharpening implements NamedEntity {
    @IsNumber()
    id!: number;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    ukr?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    eng?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    rus?: string | null;
}

export class Usage implements NamedEntity {
    @IsNumber()
    id!: number;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    ukr?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    eng?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    rus?: string | null;
}

// ================= КАТЕГОРІЇ =================

export class Category implements BaseEntity {
    @IsNumber()
    id!: number;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    ukr_name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    eng_name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(800)
    comments!: string;
}

// ================= ГОЛОВНА СУТНІСТЬ - ITEMS =================

export class WeaponItem implements BaseEntity {
    @IsNumber()
    id!: number;

    @IsBoolean()
    ready!: boolean;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(6300)
    description_ukr?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(6300)
    description_eng?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(6300)
    description_rus?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(120)
    ukr_name?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(120)
    eng_name?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(120)
    rus_name?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(25)
    handle_len?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    handle_len_w!: string;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(25)
    total_len?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(25)
    blade_len?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(25)
    width?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(20)
    guard_width?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(25)
    thikness?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(25)
    weight?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    theritory?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(25)
    century?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    arch_period?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    epoha?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(20)
    guard_type?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(20)
    blade_type?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    global_type?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(10)
    dolls?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    using_it?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(10)
    sharpening?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    apple?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(800)
    links?: string | null;

    @IsOptional()
    @IsOptional()
    @IsString()
    @MaxLength(800)
    comments?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(800)
    source!: string;

    @IsNumber()
    category_id!: number;

    @IsOptional()
    category_ids?: number[];

    @IsOptional()
    categories_data?: Category[];
}

// ================= DTO для API =================

export interface CreateWeaponItemDto extends Omit<WeaponItem, 'id' | 'categories_data'> { }

export interface UpdateWeaponItemDto extends Partial<CreateWeaponItemDto> { }

export interface WeaponItemResponse extends WeaponItem {
    category?: Category;
    category_name?: string;
    categories_data?: Category[];
    epoha_data?: Epoha;
    guard_type_data?: GuardType;
    blade_type_data?: BladeType;
    dolls_data?: Dolls;
    usage_data?: Usage;
    sharpening_data?: Sharpening;
}

// Типи для всіх сутностей
export type EntityType =
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

// Мапа назв сутностей
export const ENTITY_NAMES = {
    apple: 'apple',
    blade_type: 'blade_type',
    categories: 'categories',
    dolls: 'dolls',
    epoha: 'epoha',
    global_type: 'global_type',
    guard_type: 'guard_type',
    sharpening: 'sharpening',
    usage: 'usage',
    items: 'items'
} as const;

export type EntityName = keyof typeof ENTITY_NAMES; 