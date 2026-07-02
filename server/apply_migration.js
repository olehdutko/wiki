
const mysql = require('mysql2/promise');
(async () => {
    const c = await mysql.createConnection({
        host: '192.168.1.132',
        user: 'wiki_app',
        password: 'WikiApp123!',
        database: 'weaponry_online_db'
    });
    const [cols] = await c.execute(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='weaponry_online_db' AND TABLE_NAME='item_images' AND COLUMN_NAME='show'`);
    if (cols.length === 0) {
        await c.execute(`ALTER TABLE item_images ADD COLUMN \`show\` TINYINT(1) NOT NULL DEFAULT 0`);
        console.log('column added');
    } else {
        console.log('column already exists');
    }
    await c.end();
})();
