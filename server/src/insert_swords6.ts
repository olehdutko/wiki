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

        const swords = [["Гань Цзян", "Gàn Jiàng / 干将", "легендарный меч, выкованный из метеоритного железа китайским кузнецом Гань Цзяном, названный в честь кузнеца. Его жена бросилась в пламя, чтобы огонь достиг температуры, при которой можно закалить такой меч."], ["Мо Се", "Mò Xié / 莫耶", "легендарный меч, выкованный из метеоритного железа китайским кузнецом Гань Цзяном, названный в честь его жены, которая бросилась в пламя, чтобы огонь достиг нужной температуры для закалки."], ["Дхами", "Dhami / أنتار", "меч Антары, чернокожего арабского воина-поэта."], ["Зуль-хайят", "Zool hyyat / ذو الحيات", "меч врага Антара Залим ибн-Харита (Zalim ibn-Harith), а затем Харит аль-Залима (Harith al-Zalim)."], ["Кусанаги", "Kusanagi / 草薙剣", "священный меч, преподнесённый богине Аматэрасу богом Сусаноо, принадлежит к Трем Великим Сокровищам Императора (Япония). Добыт, согласно преданию, из хвоста восьмиголового дракона. Мог управлять ветрами."], ["Ратна Мару", "Ratna Maru", "меч Калки."], ["Тоцука-но цуруги", "Totsuka-no Tsurugi / 十拳剣", "легендарный клинок, принадлежавший богу Ветра Сусаноо. Этим мечом Сусаноо отрубил все головы и хвосты Ямата-но ороти. Кроме этого, меч был использован Идзанаги для убийства бога Огня, своего сына."], ["Тхуантхьен", "Thuận Thiên / 順天", "мифический меч, дарованный волшебной золотой черепахой озера «Хоанкьем» вьетскому императору Ле Лою, который с помощью него освободил в XV в. свою страну Дайвьет от китайского владычества."], ["Чандрахас", "Chandrahas / चन्द्रहास", "меч Раваны, повелителя ракшасов в «Рамаяне»."], ["Шамшир-е Зоморроднегар", "Shamshir-e Zomorrodnegar / شمشیر زمردنگا", "меч Эмира Арсалана (Amir Arsalan), принадлежавший до этого царю Соломону (в персидском фольклоре)."]];

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
