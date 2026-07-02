-- Add display_order column to item_images to support drag-and-drop reordering
ALTER TABLE item_images ADD COLUMN display_order INT UNSIGNED NOT NULL DEFAULT 0;

-- Initialize existing rows with order based on creation time (oldest first)
SET @row_number = 0;
UPDATE item_images
SET display_order = (@row_number := @row_number + 1)
WHERE item_id IN (
  SELECT item_id FROM (
    SELECT DISTINCT item_id FROM item_images
  ) AS tmp
)
ORDER BY item_id, created_at ASC, id ASC;

-- Create index to speed up ordered image queries
ALTER TABLE item_images ADD INDEX idx_item_images_order (item_id, display_order);
