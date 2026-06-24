-- Migration: Add imperial units columns for automatic conversion
-- Lengths: mm → inches (1 inch = 25.4 mm)
-- Weight: grams → pounds (1 lb = 453.59237 g)

-- Add inches columns for length measurements
ALTER TABLE `items` 
    ADD COLUMN IF NOT EXISTS `total_len_in` VARCHAR(50) NULL COMMENT 'Загальна довжина в дюймах',
    ADD COLUMN IF NOT EXISTS `blade_len_in` VARCHAR(50) NULL COMMENT 'Довжина клинка в дюймах',
    ADD COLUMN IF NOT EXISTS `handle_len_in` VARCHAR(50) NULL COMMENT 'Довжина руківя в дюймах',
    ADD COLUMN IF NOT EXISTS `width_in` VARCHAR(50) NULL COMMENT 'Ширина в дюймах',
    ADD COLUMN IF NOT EXISTS `guard_width_in` VARCHAR(50) NULL COMMENT 'Ширина гарди в дюймах',
    ADD COLUMN IF NOT EXISTS `thikness_in` VARCHAR(50) NULL COMMENT 'Товщина в дюймах';

-- Add pounds column for weight
ALTER TABLE `items`
    ADD COLUMN IF NOT EXISTS `weight_lb` VARCHAR(50) NULL COMMENT 'Вага в фунтах';
