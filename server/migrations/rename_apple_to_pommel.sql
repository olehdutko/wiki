-- Migration: rename apple -> pommel (schema, data, image URLs)
-- Run manually against weaponry_online_db

-- 1. Rename foreign key column in items
ALTER TABLE `items` CHANGE COLUMN `apple` `pommel` VARCHAR(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- 2. Rename reference table
RENAME TABLE `apple` TO `pommel`;

-- 3. Update all stored image URLs to point at the new uploads folder
UPDATE `pommel` SET `image_url` = REPLACE(`image_url`, '/uploads/wiki/apple/', '/uploads/wiki/pommel/')
WHERE `image_url` IS NOT NULL AND `image_url` LIKE '%/uploads/wiki/apple/%';
