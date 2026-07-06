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

        const swords = [
            {
                rus_name: 'Дайнслейф',
                eng_name: 'Dáinsleif',
                description_rus: 'меч из легенд викингов. Выкован карликами. Не может вернуться в ножны, если никого не убил. Принадлежал королю Хогни (Hogni).'
            },
            {
                rus_name: 'Меч Ёкуля',
                eng_name: null,
                description_rus: 'меч Греттира, прежде принадлежавший его деду Ёкулю.'
            },
            {
                rus_name: 'Кверн-битер',
                eng_name: 'Quern-biter',
                description_rus: 'меч короля Хакона I и Торальфа Сколинсона (Thoralf Skolinson).'
            },
            {
                rus_name: 'Колебранд',
                eng_name: 'Kolebrand',
                description_rus: 'меч Риболта (Herr Ribolt).'
            },
            {
                rus_name: 'Лэватейнн',
                eng_name: null,
                description_rus: 'меч из эддической поэмы «Fjölsvinnsmál». Мог быть выкован Велундом.'
            },
            {
                rus_name: 'Легбитер',
                eng_name: 'Legbiter',
                description_rus: 'меч Магнуса III Норвежского.'
            },
            {
                rus_name: 'Меч Алиуса и меч Олиуса',
                eng_name: 'Alíusar sverð / Olíusar sverð',
                description_rus: 'парные мечи, выкованные карликами Алиусом и Олиусом для короля Будли Шведского (Budli), «Ásmundar saga kappabana».'
            },
            {
                rus_name: 'Миммеринг',
                eng_name: 'Mimmering / Mimmung / Mimming / Mimminc / Mimminge / Mîminge / Mimungr / Minnungur',
                description_rus: 'меч Видрика Верландсона (Виттиха) (Vidrik Verlandson; Wittich), датская баллада. Выкован Вейландом. Затем принадлежал Дитриху и Хейму (Heim), который отдал его Зигфриду.'
            },
            {
                rus_name: 'Мистелтейнн',
                eng_name: null,
                description_rus: 'меч из саги «Hrómundar Saga Gripssonar», никогда не мог затупиться. Был выигран Хромундом у бессмертного короля-волшебника.'
            },
            {
                rus_name: 'Нагерлинг',
                eng_name: null,
                description_rus: 'меч Дитриха фон Берна (Dietrich Von Bern). Выкован великаном Гримом. Отождествляется с Наглхрингом, принадлежавшим Гриму в «Саге о Тиореке».'
            },
            {
                rus_name: 'Рефил',
                eng_name: 'Refil',
                description_rus: 'меч Регина в одной из версий «Песни о Нибелунгах».'
            },
            {
                rus_name: 'Ридилл и Хротти',
                eng_name: 'Ridill и Hrotti',
                description_rus: 'два магических меча, часть сокровищ Фафнира, найдены Зигфридом. Ридиллом Зигфрид вырезал Фафниру сердце.'
            },
            {
                rus_name: 'Росса',
                eng_name: null,
                description_rus: 'меч Отвита, короля лангобардов. Подарен ему королём карликов Альбрихом. Сиял всеми цветами.'
            },
            {
                rus_name: 'Сахо',
                eng_name: 'Sacho / Sachu',
                description_rus: 'меч Эка (Eck).'
            },
            {
                rus_name: 'Скофнунг',
                eng_name: null,
                description_rus: 'меч Кормака, принадлежавший Скегги. В нём были заключены души двенадцати берсерков («Сага о Кормаке»).'
            },
            {
                rus_name: 'Тюрвинг, Тюрфинг',
                eng_name: 'Tyrfing / Tirfing / Tervingi',
                description_rus: 'магический меч, вылетая из ножен, ищет жертвы и не идет обратно в ножны, пока не прольется кровь. Первым владельцем был король Свафрлами («Старшая Эдда»). Согласно «Саге о Хледе» (эддическая песнь, не входящая в Codex Regius («Королевский Кодекс») и описывающая битву на Каталаунских полях и её предпосылки) это меч Ангантюра (Агантира), короля готов, которым он сражался в битве Каталауна. В этой саге он упоминается в ст. 9: «…И воинов много\nПадет на траву,\nПрежде чем Тюрвинг начну я делить…» и в прозаической вставке между ст. 29 и 30: «…что полки гуннов дрогнули. Увидев это, Ангантюр вышел из ограды щитов, стал во главе войска и, взяв Тюрвинг в руки, начал рубить людей и коней». Его же меч в «Саге о Фритьофе Смелом». У Рихарда Вагнера — меч Одина.'
            },
            {
                rus_name: 'Хвитинг',
                eng_name: null,
                description_rus: '«Белый» — меч Берси. Поражает врага, но исцеляет друга, если прикоснется плашмя. («Сага о Кормаке»).'
            }
        ];

        for (const sword of swords) {
            const [result] = await connection.execute(
                `INSERT INTO items (rus_name, eng_name, description_rus, category_id)
                 VALUES (?, ?, ?, ?)`,
                [sword.rus_name, sword.eng_name, sword.description_rus, 44]
            );
            const itemId = (result as any).insertId;
            console.log(`Inserted item ID: ${itemId} — ${sword.rus_name}`);

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
