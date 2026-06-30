const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    // Ensure tables exist
    await pool.execute(`
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
    `);

    const [items] = await pool.execute("SELECT id, theritory FROM items WHERE theritory IS NOT NULL AND TRIM(theritory) <> ''");

    const nameToId = new Map();
    let createdCount = 0;
    let linkCount = 0;

    for (const item of items) {
      const names = String(item.theritory)
        .split(',')
        .map(n => n.trim())
        .filter(n => n.length > 0);

      for (const name of [...new Set(names)]) {
        let territoryId = nameToId.get(name);
        if (!territoryId) {
          try {
            const [result] = await pool.execute(
              'INSERT INTO territory (ukr_name) VALUES (?) ON DUPLICATE KEY UPDATE ukr_name=ukr_name',
              [name]
            );
            if (result.insertId) {
              territoryId = result.insertId;
            } else {
              const [[row]] = await pool.execute('SELECT id FROM territory WHERE ukr_name = ?', [name]);
              territoryId = row.id;
            }
            nameToId.set(name, territoryId);
            createdCount++;
          } catch (e) {
            console.error('Error inserting territory:', name, e.message);
            continue;
          }
        }

        try {
          await pool.execute(
            'INSERT IGNORE INTO item_territories (item_id, territory_id) VALUES (?, ?)',
            [item.id, territoryId]
          );
          linkCount++;
        } catch (e) {
          console.error('Error linking item territory:', item.id, territoryId, e.message);
        }
      }
    }

    console.log(`Migration complete: ${createdCount} territories, ${linkCount} links`);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
