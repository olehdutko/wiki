-- Міграція: створення таблиць territory та item_territories
CREATE TABLE IF NOT EXISTS territory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ukr_name VARCHAR(300) NOT NULL,
    eng_name VARCHAR(300) NULL,
    rus_name VARCHAR(300) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_territory_ukr_name (ukr_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS item_territories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    territory_id INT NOT NULL,
    UNIQUE KEY uk_item_territory (item_id, territory_id),
    KEY idx_item (item_id),
    KEY idx_territory (territory_id),
    CONSTRAINT fk_item_territories_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_territories_territory FOREIGN KEY (territory_id) REFERENCES territory(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

