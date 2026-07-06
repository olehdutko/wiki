import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('/Users/odutko/projects/wiki/.env') });

async function insertSwords() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || '192.168.1.132',
        user: process.env.DB_USER || 'wiki_app',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'weaponry_online_db',
        port: parseInt(process.env.DB_PORT || '3306'),
        charset: 'utf8mb4',
        connectionLimit: 1,
    });

    try {
        const connection = await pool.getConnection();
        await connection.ping();
        console.log('DB connected');

        const swords = [["Камифуса-но-сукэ Канэсигэ", "Kamifusanosuke Kaneshige", "меч Мусаси, сделан в Бидзэне.", 14], ["Когарасу-мару", "Kogarasu-maru / 小烏丸", "родовой меч семьи Тайра.", 14], ["Нукэмару", "Nukemaru / 抜丸", "родовой меч семьи Тайра.", 14], ["Самсамха", "Samsamha / Sansamha", "меч Гаруна-ар-Рашида, халифа Багдадского.", 14], ["Монохоси Дзао", "Monohoshi Zao / 蔵王", "нодати Сасаки Кодзиро работы мастера Нагамицу из Бидзэна.", 14], ["Аль-самсама", "Al-samsama / الصامصامة", "меч йеменского поэта-воина Амр бен Мадикариба аль-Зубайди (Amr b. Ma’dīkarib al-Zubaidī; Amr bin Maadi Karib), по прозвищу Abu Thaur («отец быка»).", 14], ["Змеиный меч", "Snake Sword / Naga Sword", "принадлежал индийскому царю Ашоке.", 14]];

        for (const sword of swords) {
            const [result] = await connection.execute(
                `INSERT INTO items (rus_name, eng_name, description_rus, category_id)
                 VALUES (?, ?, ?, ?)`,
                [sword[0], sword[1], sword[2], sword[3]]
            );
            const itemId = (result as any).insertId;
            console.log(`Inserted item ID: ${itemId} — ${sword[0]}`);

            await connection.execute(
                `INSERT INTO item_categories (item_id, category_id, is_primary)
                 VALUES (?, ?, ?)`,
                [itemId, sword[3], 1]
            );
            console.log(`Linked item ${itemId} to category ${sword[3]}`);
        }

        connection.release();
        await pool.end();
        console.log('Done');
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
        process.exit(1);
    }
}

insertSwords();
