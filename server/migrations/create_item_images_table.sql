-- Migration: Create item_images table for item gallery
-- Created: 2026-06-28

CREATE TABLE IF NOT EXISTS `item_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_item_file` (`item_id`, `file_name`),
  INDEX `idx_item_images_item_id` (`item_id`),
  INDEX `idx_item_images_primary` (`item_id`, `is_primary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
