
const mysql = require('mysql2/promise');
(async () => {
    const c = await mysql.createConnection({
        host: '192.168.1.132',
        user: 'wiki_app',
        password: 'WikiApp123!',
        database: 'weaponry_online_db'
    });
    const [tables] = await c.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='weaponry_online_db' ORDER BY table_name");
    for (const t of tables) {
        const tableName = t.table_name || t.TABLE_NAME;
        const [r] = await c.execute(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
        console.log(tableName + ': ' + r[0].cnt);
    }
    await c.end();
})();
