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

        const swords = [["Хофуд", "Hofud", "меч Хеймдаля, стража Бильфроста."], ["Хундингсбана", null, "волшебный меч Фрейра, который сражался сам по себе."], ["Хрубинг", null, "его сталь закалена соком ядовитых трав, кровью, добытой в сражениях."], ["Хрутинг", null, "меч Беовульфа (данный ему Унфертом и затем вернувшийся к нему)."], ["Нэглинг", null, "второй меч Беовульфа, сломавшийся в битве с драконом."], ["Шрит", "Schrit", "меч Битерольфа (Biterolf)."], ["Адолейк", "Adolake / Hatholake", "меч сэра Торрента Портенгейльского (Torrent of Portyngale), выкован Вейландом."], ["Аронди", "Arondie / Arondight", "меч Ланселота. Получил его в возрасте 18 лет во время посвящения в рыцари королём Артуром. Упоминается также другой его меч — Chastiefol, а против саксов он сражался мечом по имени Seure. В итальянском эпосе он владел мечом Кьяренца (Chiarenza, «Ясность»)."], ["Балисарда", "Bélisandre / Bélisandra / Balisarde", "магический меч Роджеро, врага Рено де Монтабана. Дар волшебницы. (Ариосто, «Неистовый Роланд», II, 6). Также — шутливое прозвище, которым называл свою изящную шпагу Портос в «Трех мушкетерах»."], ["Транкера", "Tranchera", "меч Агрикана, противника Орландо (в «Неистовом Роланде»)."], ["Бейерлант", "Beierlant", "меч Трефериса (Treferis), цикл Дитриха фон Бёрна."], ["Балсвенден", "Balswenden / Palswendin", "меч Таргиса Туртозского (Targis von Tortôse), одного из сарацинских графов Марселя, врага Роланда."], ["Батисм", "Batism", "меч сарацинского рыцаря Фьерабраса (Fierabras, Ferumbras). Два других его меча, выкованные тем же кузнецом по имени Ansias — Florence и Graban."], ["Биттерфер", "Bitterfer", "меч, который дала Горну принцесса Римнельд. Выкован Вейландом. (Английская баллада «Король Горн»)."], ["Блауайн", "Blauain", "другой меч Горна, захвачен им у ирландского короля Малакина (Malakin)."], ["Васке", "Waskë", "меч Зинтрама (Sintram), персонажа Фридриха де ла Мотт Фукэ."], ["Галатин", "Galatine / Galatyn / Galantyne", "меч сэра Гавейна."], ["Морглес", "Murgleis", "меч графа Ганелона, отчима Роланда."], ["Альтеклер, Отклер", "Hauteclaire", "меч Оливье, выкован Геласом. Согласно поэме «Жирар Вианский», до Оливье этот меч принадлежал римскому императору Клозамонту, который потерял его в лесу. После того как меч был найден, его отдали папе римскому, но затем им завладел Пипин Короткий, отец Карла Великого, который подарил его одному своему вассалу; последний продал его еврею Иоахиму, ровеснику Понтия Пилата (вечному жиду). Во время поединка с Роландом у Оливье ломается меч. Роланд разрешает ему дослать в Виану за другим. Тогда Иоахим присылает ему Альтеклер, и поединок заканчивается миром."], ["Кларми", "Clarmie", "меч Энгелирса Васконского (Engelirs of Wasconia), германские тексты."], ["Курешуз", "Courechouse", "меч короля Бана, отца Ланцелота."], ["Куртуаз", "Courtoise", "меч Вильгельма I, графа Ангулемского (929—956 гг.)."], ["Корруг", "Corrougue", "меч Отюэля (Otuel, Otinel)."], ["Марвейёз", "Merveilleuse", "меч Дулина Майнцского (Doolin of Mayence)."], ["Мармадуаз", "Marmadoise", "меч Фроля Немецкого (Frolle d’Allemagne) в артуровском цикле, противопоставлялся Экскалибуру."], ["Морглэ, Моргли", "Morglay / Mor-glaif", "меч Бевиса Хэмптонского (Bevis de Hampton)."], ["Рос", "Rose / Rosse / Rossë / Rôse", "меч, первоначально принадлежавший Орниту Ломбардскому (Ortnit of Lombardy), но найденный Вольфдитрихом (Wolfdietrich)."], ["Сантакрукс", "Santacrux", "меч Тибо де Совиньи (Thibault de Sauvigny), («Le Chevalier au bouclier vert»)."], ["Фламберж, Фламберг, Фруберта, Флоберж, Фламборж", "Flamberge / Floberge / Flamborge", "меч Рено де Монтабана, одолженный ему кузеном Можисом (Maugis), выкован Велундом. Также упоминался как принадлежавший Карлу Великому, сделан Галасом."], ["Эгекинг", "Egeking / Erkyin", "меч, который взял Грим (Grime), чтобы сразиться с рыцарем Грейстилом (Greysteel), победившим его друга Эгера (Eger) и жестоко отрубившим последнему мизинец в знак победы."]];

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
