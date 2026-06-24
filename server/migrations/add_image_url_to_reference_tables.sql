-- Migration: Add image_url column to reference tables
-- Created: 2026-06-24 16:11:23

-- Add image_url column to guard_type table
ALTER TABLE guard_type ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL;

-- Add image_url column to apple table
ALTER TABLE apple ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL;

-- Add image_url column to sharpening table  
ALTER TABLE sharpening ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_guard_type_image ON guard_type(image_url);
CREATE INDEX IF NOT EXISTS idx_apple_image ON apple(image_url);
CREATE INDEX IF NOT EXISTS idx_sharpening_image ON sharpening(image_url);
