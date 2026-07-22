import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const conn = await mysql.createConnection({
    host: '192.168.1.132',
    user: 'odutko',
    password: '123456',
    database: 'wiki_db'
  });

  // Load weapon records
  const records = JSON.parse(fs.readFileSync('/Users/odutko/projects/wiki/african_weapons_digitized/weapon_records.json', 'utf8'));
  
  console.log(`Processing ${records.length} weapons...`);
  
  const insertedItems = [];
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const name = record.name.substring(0, 255);
    const desc = record.description.substring(0, 4000);
    
    // 1. Insert item
    const [itemResult] = await conn.execute(
      'INSERT INTO items (eng_name, description_eng, ukr_name, description_ukr, status) VALUES (?, ?, ?, ?, ?)',
      [name, desc, null, null, 'active']
    );
    const itemId = itemResult.insertId;
    
    // 2. Insert territory
    await conn.execute(
      'INSERT INTO item_territories (item_id, territory_id) VALUES (?, ?)',
      [itemId, 86]
    );
    
    // 3. Insert category
    await conn.execute(
      'INSERT INTO item_categories (item_id, category_id) VALUES (?, ?)',
      [itemId, 40]
    );
    
    insertedItems.push({ id: itemId, name, original: record.original, new_filename: record.new_filename });
    
    if ((i + 1) % 10 === 0) {
      console.log(`  Inserted ${i + 1}/${records.length}`);
    }
  }
  
  // Save mapping file
  fs.writeFileSync('/Users/odutko/projects/wiki/inserted_items.json', JSON.stringify(insertedItems, null, 2));
  
  console.log(`\nDone! Inserted ${insertedItems.length} items.`);
  console.log('Mapping saved to /Users/odutko/projects/wiki/inserted_items.json');
  
  await conn.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
