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

        const swords = [["Гламдринг", "Glamdring", "меч Гэндальфа, откованный в Гондолине. (Дж. Р. Р. Толкин («Властелин Колец» и «Сильмариллион»))"], ["Жало", "Sting", "эльфийский длинный кинжал, принадлежавший Бильбо и затем подаренный Фродо. (Дж. Р. Р. Толкин («Властелин Колец» и «Сильмариллион»))"], ["Нарсил", "Narsil", "меч Элендила. Перекован для Арагорна, новое имя — Андурил. (Дж. Р. Р. Толкин («Властелин Колец» и «Сильмариллион»))"], ["Оркрист", "Orcrist", "меч, принадлежавший Торину Дубощиту и захороненный вместе с ним, как и Гламдринг, откован в Гондолине. (Дж. Р. Р. Толкин («Властелин Колец» и «Сильмариллион»))"], ["Англахель", "Anglachel", "меч Турина Турамбара. Носил также имя Гуртанг. (Дж. Р. Р. Толкин («Властелин Колец» и «Сильмариллион»))"], ["Ангуирель", "Anguirel", "меч Эола Тёмного Эльфа, выкован как и Англахель самим Эолом из чёрного металла. (Дж. Р. Р. Толкин («Властелин Колец» и «Сильмариллион»))"], ["Рингиль", "Ringil", "«Льдистая Звезда», меч Финголфина. (Дж. Р. Р. Толкин («Властелин Колец» и «Сильмариллион»))"], ["Хэругрим", "Herugrim", "меч короля Рохана Теодена. (Дж. Р. Р. Толкин («Властелин Колец» и «Сильмариллион»))"], ["Аранрут", "Aranrúth", "меч короля Дориата Тингола. (Дж. Р. Р. Толкин («Властелин Колец» и «Сильмариллион»))"], ["Гутвин", "Gúthwinë", "меч Эомера, племянника Теодена. (Дж. Р. Р. Толкин («Властелин Колец» и «Сильмариллион»))"]];

        for (const sword of swords) {
            const [result] = await connection.execute(
                `INSERT INTO items (rus_name, eng_name, description_rus, category_id)
                 VALUES (?, ?, ?, ?)`,
                [sword[0], sword[1], sword[2], 44]
            );
            const itemId = (result as any).insertId;
            console.log(`Inserted item ID: ${itemId} — ${sword[0]}`);

            await connection.execute(
                `INSERT INTO item_categories (item_id, category_id, is_primary)
                 VALUES (?, ?, ?)`,
                [itemId, 44, 1]
            );
            console.log(`Linked item ${itemId} to category 44`);
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
