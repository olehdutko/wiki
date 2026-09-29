-- Migration: create item_audit_logs table
-- Project: Wiki (weaponry encyclopedia)
-- Branch: feature/item-audit-log

CREATE TABLE IF NOT EXISTS item_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    field_name VARCHAR(100) NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    changed_by VARCHAR(255) NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item_id (item_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Add restore tracking columns
ALTER TABLE item_audit_logs
    ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS restored_by VARCHAR(255) NULL DEFAULT NULL;
