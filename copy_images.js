const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const UPLOAD_BASE_DIR = '/Users/odutko/projects/wiki/public/uploads/items';
const SOURCE_DIR = '/Users/odutko/projects/wiki/african_weapons_digitized/renamed_images';

function getItemSlug(item) {
    const name = item.eng_name || item.ukr_name || item.rus_name;
    if (!name) return 'item-' + item.id;
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function getItemFolderName(item) {
    return item.id + '-' + getItemSlug(item);
}

async function main() {
    const conn = await mysql.createConnection({
        host: '192.168.1.132',
        user: 'wiki_app',
        password: 'WikiApp123!',
        database: 'weaponry_online_db'
    });

    const mapping = JSON.parse(fs.readFileSync('/Users/odutko/projects/wiki/item_id_mapping.json', 'utf8'));
    console.log('Processing ' + mapping.length + ' items...');
    
    let success = 0;
    let errors = [];
    
    for (let i = 0; i < mapping.length; i++) {
        const item = mapping[i];
        const itemId = item.item_id;
        const fileName = item.new_filename;
        
        const [rows] = await conn.execute(
            'SELECT id, eng_name, ukr_name, rus_name FROM items WHERE id = ?',
            [itemId]
        );
        
        if (rows.length === 0) {
            errors.push({ itemId: itemId, error: 'Item not found' });
            continue;
        }
        
        const dbItem = rows[0];
        const folderName = getItemFolderName(dbItem);
        const itemDir = path.join(UPLOAD_BASE_DIR, folderName);
        
        if (!fs.existsSync(itemDir)) {
            fs.mkdirSync(itemDir, { recursive: true });
        }
        
        const sourcePath = path.join(SOURCE_DIR, fileName);
        const targetPath = path.join(itemDir, fileName);
        
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, targetPath);
            
            await conn.execute(
                'INSERT INTO item_images (item_id, file_name, is_primary, `show`, display_order) VALUES (?, ?, ?, ?, ?)',
                [itemId, fileName, 1, 1, 1]
            );
            
            success++;
            if ((i + 1) % 10 === 0) {
                console.log('  Processed ' + (i + 1) + '/' + mapping.length);
            }
        } else {
            errors.push({ itemId: itemId, fileName: fileName, error: 'Source file not found' });
        }
    }
    
    console.log('\nDone! Success: ' + success + ', Errors: ' + errors.length);
    if (errors.length > 0) {
        console.log('Errors:');
        errors.forEach(e => console.log('  ' + e.itemId + ': ' + e.error + ' (' + (e.fileName || '') + ')'));
    }
    
    await conn.end();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
