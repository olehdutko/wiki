-- Add show flag to item_images
ALTER TABLE item_images ADD COLUMN IF NOT EXISTS `show` TINYINT(1) NOT NULL DEFAULT 0;
