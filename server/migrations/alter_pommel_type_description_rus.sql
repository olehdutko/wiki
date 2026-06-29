-- Migration: add type/description/rus fields to pommel table
-- Run manually against weaponry_online_db
-- Assumes table is already renamed from `apple` to `pommel`

-- 1. Add new columns
ALTER TABLE `pommel`
    ADD COLUMN `type` VARCHAR(10) NULL COMMENT 'Типологія навершя',
    ADD COLUMN `description` VARCHAR(1000) NULL COMMENT 'Опис навершя',
    ADD COLUMN `rus` VARCHAR(100) NULL COMMENT 'Російська назва';

-- 2. Copy existing typological data from old rus column to type column
-- (only if you previously had rus data used as type; skip if table is fresh)
-- UPDATE `pommel` SET `type` = `rus` WHERE `rus` IS NOT NULL AND `rus` <> '';

-- 3. Add indexes for performance
CREATE INDEX `idx_pommel_type` ON `pommel`(`type`);
CREATE INDEX `idx_pommel_description` ON `pommel`(`description`(255));
