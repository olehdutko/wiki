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

        const swords = [["Ледяная Смерть", "Icingdeath", "меч Дриззта До’Урдена. Сабля обладала силой льда и делала своего владельца неуязвимым к огню, а также наносила немалый урон созданиям пламени, в том числе и демонам. (Р. Сальваторе («Долина Ледяного Ветра»))"], ["Мерцающий", "Twinkle", "меч Дриззта До’Урдена. (Р. Сальваторе («Долина Ледяного Ветра»))"], ["Хазид-хи", "Khazid'hea", "меч с собственным разумом, некогда принадлежавший разным персонажам (Кетти-бри, Тос’ун Армго, Обальд Многострельный, Дриззт До’Урден, Деления Керти). Меч был настолько острым, что мог резать даже камень, а также единственный мог прорезать магические доспехи Обальда. (Р. Сальваторе («Долина Ледяного Ветра»))"], ["Коготь Шарона", "Charon's Claw", "меч с собственной волей. Если меч возьмёт в руки человек со слабой волей, с него сойдут кожа и мясо; для предотвращения этого существует специальная перчатка. Меч обрёл Артемис Энтрери после того, как убил шейда. (Р. Сальваторе («Долина Ледяного Ветра»))"], ["Риндон", "Rhindon", "меч короля Питера."], ["Грейсвандир", "Grayswandir", "меч Корвина."], ["Вервиндль", "Werewindle", "меч Бренда."], ["Меч Годрика Гриффиндора", "Sword of Gryffindor", "меч Годрика Гриффиндора."], ["Калландор", "Callandor", "кристаллический меч, «Меч-Который-Не-Меч», меч, которого нельзя коснуться, один из артефактов Эпохи Легенд. Появился в книге Роберта Джордана («Возрождённый дракон»)."], ["Меч Кринг", "Kring", "в романе «Цвет Волшебства»: в главах «Пришествие Восьми» и «Притяжение Черва» принадлежал герою Хруну-Варвару. (Терри Пратчетта)"], ["Меч Смерти", "Death's Sword", "появляется в нескольких романах, как и коса, служит для отсечения души от тела. По словам Смерти, «короли удостаиваются меча, ведь коса — крестьянский инструмент». (Терри Пратчетта)"]];

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
