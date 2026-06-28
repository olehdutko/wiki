/**
 * Сервіс для роботи з зображеннями айтемів
 */

import fs from 'fs';
import path from 'path';
import { pool } from '../config/database.config';
import { getItemFolderName, generateFileName } from '../utils/slug';

// Базова папка для зображень айтемів
const UPLOAD_BASE_DIR = process.env.ITEM_UPLOAD_DIR || '/Users/odutko/projects/wiki/public/uploads/items';

// Дозволені MIME-типи
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

export interface ItemImage {
    id: number;
    item_id: number;
    file_name: string;
    is_primary: boolean;
    created_at: string;
}

export interface ImageItemInfo {
    id: number;
    eng_name?: string | null;
    ukr_name?: string | null;
    rus_name?: string | null;
}

/**
 * Отримати повний шлях до папки айтема
 */
export function getItemUploadDir(item: ImageItemInfo): string {
    const folderName = getItemFolderName(item);
    return path.join(UPLOAD_BASE_DIR, folderName);
}

/**
 * Отримати URL до зображення айтема
 */
export function getItemImageUrl(item: ImageItemInfo, fileName: string): string {
    const folderName = getItemFolderName(item);
    return `/uploads/items/${folderName}/${fileName}`;
}

/**
 * Переконатися, що папка існує
 */
function ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Перевірити, чи дозволений тип файлу
 */
function isAllowedMimeType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.includes(mimeType);
}

export class ItemImagesService {
    /**
     * Отримати всі зображення для айтема
     */
    async getImagesByItemId(itemId: number): Promise<ItemImage[]> {
        const [rows] = await pool.execute(
            `SELECT id, item_id, file_name, is_primary, created_at
             FROM item_images
             WHERE item_id = ?
             ORDER BY is_primary DESC, created_at ASC`,
            [itemId]
        ) as any;

        return rows.map((row: any) => ({
            ...row,
            is_primary: Boolean(row.is_primary)
        }));
    }

    /**
     * Завантажити масив файлів для айтема
     */
    async uploadImages(
        item: ImageItemInfo,
        files: Express.Multer.File[]
    ): Promise<ItemImage[]> {
        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }

        const itemDir = getItemUploadDir(item);
        ensureDir(itemDir);

        // Перевіряємо типи файлів
        for (const file of files) {
            if (!isAllowedMimeType(file.mimetype)) {
                throw new Error(`File type not allowed: ${file.mimetype}. Only JPG/PNG allowed.`);
            }
        }

        const existingImages = await this.getImagesByItemId(item.id);
        const startIndex = existingImages.length + 1;

        const uploadedImages: ItemImage[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = generateFileName(item, startIndex + i, file.originalname);
            const filePath = path.join(itemDir, fileName);

            // Якщо файл вже існує — додаємо суфікс
            let uniqueFileName = fileName;
            let uniqueFilePath = filePath;
            let suffix = 1;

            while (fs.existsSync(uniqueFilePath)) {
                const ext = fileName.split('.').pop() || 'jpg';
                const baseName = fileName.replace(`.${ext}`, '');
                uniqueFileName = `${baseName}-${suffix}.${ext}`;
                uniqueFilePath = path.join(itemDir, uniqueFileName);
                suffix++;
            }

            // Зберігаємо файл як є — без обробки
            fs.writeFileSync(uniqueFilePath, file.buffer);

            // Додаємо запис в БД
            const [result] = await pool.execute(
                `INSERT INTO item_images (item_id, file_name, is_primary) VALUES (?, ?, ?)`,
                [item.id, uniqueFileName, existingImages.length === 0 && i === 0 ? 1 : 0]
            ) as any;

            uploadedImages.push({
                id: result.insertId,
                item_id: item.id,
                file_name: uniqueFileName,
                is_primary: existingImages.length === 0 && i === 0,
                created_at: new Date().toISOString()
            });
        }

        // Якщо це перші зображення — перше автоматично стає primary
        if (existingImages.length === 0 && uploadedImages.length > 0) {
            await this.setPrimaryImage(item.id, uploadedImages[0].id);
            uploadedImages[0].is_primary = true;
        }

        return uploadedImages;
    }

    /**
     * Встановити primary зображення для айтема
     */
    async setPrimaryImage(itemId: number, imageId: number): Promise<void> {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Спочатку знімаємо primary з усіх
            await connection.execute(
                `UPDATE item_images SET is_primary = 0 WHERE item_id = ?`,
                [itemId]
            );

            // Встановлюємо primary для вказаного
            const [result] = await connection.execute(
                `UPDATE item_images SET is_primary = 1 WHERE id = ? AND item_id = ?`,
                [imageId, itemId]
            ) as any;

            if (result.affectedRows === 0) {
                throw new Error('Image not found for this item');
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Видалити зображення
     */
    async deleteImage(itemId: number, imageId: number): Promise<void> {
        const [rows] = await pool.execute(
            `SELECT file_name, is_primary FROM item_images WHERE id = ? AND item_id = ?`,
            [imageId, itemId]
        ) as any;

        if (rows.length === 0) {
            throw new Error('Image not found');
        }

        const { file_name, is_primary } = rows[0];

        // Отримуємо інформацію про айтем для шляху
        const [itemRows] = await pool.execute(
            `SELECT id, eng_name, ukr_name, rus_name FROM items WHERE id = ?`,
            [itemId]
        ) as any;

        if (itemRows.length === 0) {
            throw new Error('Item not found');
        }

        const item: ImageItemInfo = itemRows[0];
        const itemDir = getItemUploadDir(item);
        const filePath = path.join(itemDir, file_name);

        // Видаляємо файл фізично
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Видаляємо запис з БД
        await pool.execute(
            `DELETE FROM item_images WHERE id = ? AND item_id = ?`,
            [imageId, itemId]
        );

        // Якщо видалене було primary — обираємо нове primary
        if (is_primary) {
            const [remaining] = await pool.execute(
                `SELECT id FROM item_images WHERE item_id = ? ORDER BY created_at ASC LIMIT 1`,
                [itemId]
            ) as any;

            if (remaining.length > 0) {
                await this.setPrimaryImage(itemId, remaining[0].id);
            }
        }
    }

    /**
     * Отримати primary зображення для списку айтемів
     */
    async getPrimaryImagesForItems(itemIds: number[]): Promise<Map<number, string>> {
        if (itemIds.length === 0) {
            return new Map();
        }

        const placeholders = itemIds.map(() => '?').join(',');
        const [rows] = await pool.execute(
            `SELECT item_id, file_name
             FROM item_images
             WHERE item_id IN (${placeholders}) AND is_primary = 1`,
            itemIds
        ) as any;

        const result = new Map<number, string>();
        for (const row of rows) {
            result.set(row.item_id, row.file_name);
        }

        return result;
    }

    /**
     * Отримати primary зображення для одного айтема
     */
    async getPrimaryImageForItem(itemId: number): Promise<string | null> {
        const [rows] = await pool.execute(
            "SELECT file_name FROM item_images WHERE item_id = ? AND is_primary = 1 LIMIT 1",
            [itemId]
        ) as any;

        if (rows && rows.length > 0) {
            return rows[0].file_name;
        }
        return null;
    }
}
