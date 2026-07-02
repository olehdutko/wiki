
const mysql = require('mysql2/promise');
(async () => {
    const c = await mysql.createConnection({
        host: '192.168.1.132',
        user: 'wiki_app',
        password: 'WikiApp123!',
        database: 'weaponry_online_db'
    });
    const [rows] = await c.execute('SELECT id, item_id, file_name, is_primary, \`show\` FROM item_images WHERE item_id=77 LIMIT 5');
    console.log(rows);
    await c.end();
})();
