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

        const swords = [["Лёд", "Ice", "клинок Неда Старка из валирийской стали, впоследствии перекованный на два других меча. (Джордж Мартин («Песнь Льда и Огня»))"], ["Длинный Коготь", "Longclaw", "полуторный меч Джона Сноу из валирийской стали. (Джордж Мартин («Песнь Льда и Огня»))"], ["Игла", "Needle", "короткий меч Арьи Старк, который подарил ей Джон Сноу. (Джордж Мартин («Песнь Льда и Огня»))"], ["Верный Клятве", "Oathkeeper", "один из двух (второй — Вдовий плач) мечей, выкованных из клинка Неда Старка по указу Тайвина Ланнистера в подарок своему сыну Джейме, который, в свою очередь, подарил клинок Бриенне Тарт, попросив дать оружию это имя. (Джордж Мартин («Песнь Льда и Огня»))"], ["Губитель Сердец", "Heartsbane", "валирийский фамильный меч рода Тарли. (Джордж Мартин («Песнь Льда и Огня»))"], ["Рассвет", "Dawn", "фамильный меч дорнийского дома Дейнов. (Джордж Мартин («Песнь Льда и Огня»))"], ["Чёрное Пламя", "Blackfyre", "меч Эйгона Завоевателя. (Джордж Мартин («Песнь Льда и Огня»))"], ["Тёмная Сестра", "Dark Sister", "меч Висеньи Таргариен. (Джордж Мартин («Песнь Льда и Огня»))"], ["Светозарный", "Lightbringer", "меч легендарного героя Азор Ахая. Меч с таким же именем, переливающийся различными цветами, принадлежит одному из претендентов на корону Семи Королевств Станнису Баратеону. (Джордж Мартин («Песнь Льда и Огня»))"], ["Заррок", "Zar'roc", "меч Морзана, которого убил Бром и забрал меч; Бром отдал его Эрагону, у Эрагона его отобрал сын Морзана, Муртаг. (Кристофер Паолини («Эрагон»))"], ["Брисингр", "Brisingr", "меч Эрагона. Если Эрагон произносит имя меча, то он вспыхивает синим пламенем. (Кристофер Паолини («Эрагон»))"], ["Нёглинг", "Naegling", "меч Оромиса. Оромис потерял меч при битве с Муртагом над Гиллидом. (Кристофер Паолини («Эрагон»))"], ["Тамерлин", "Tamerlein", "меч Арвы, который передал его сестре, а она отдала меч Арьи. (Кристофер Паолини («Эрагон»))"], ["Рунный Сигилль из Махакама", "Sihil", "меч, который был подарен ведьмаку Геральту краснолюдом Золтаном Хивайем. (Анджей Сапковский (цикл «Ведьмак»))"], ["Ласточка", "Zireael / Swallow", "меч Цири, фактически её тёзка. (Анджей Сапковский (цикл «Ведьмак»))"]];

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
