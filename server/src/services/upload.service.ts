/**
 * Сервіс для завантаження зображень (локальне зберігання)
 */

import { randomUUID } from 'crypto';
import { pool } from '../config/database.config';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Локальна папка для зберігання зображень
const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';
const WIKI_FOLDER = 'wiki';

// Переконуємось, що папка існує
const fullUploadDir = path.join(UPLOAD_DIR, WIKI_FOLDER);
if (!fs.existsSync(fullUploadDir)) {
    fs.mkdirSync(fullUploadDir, { recursive: true });
}

export class UploadService {
    /**
     * Завантажити зображення для довідкової сутності
     */
    async uploadEntityImage(
        entityType: string,
        entityId: number,
        file: any
    ): Promise<{ imageUrl: string }> {
        try {
            // Генеруємо унікальне ім'я файлу
            const fileExtension = file.originalname.split('.').pop() || 'jpg';
            const fileName = `${entityType}_${entityId}_${randomUUID()}.${fileExtension}`;
            
            // Папка для конкретного типу сутності
            const entityDir = path.join(fullUploadDir, entityType);
            if (!fs.existsSync(entityDir)) {
                fs.mkdirSync(entityDir, { recursive: true });
            }
            
            const filePath = path.join(entityDir, fileName);
            
            // Зберігаємо файл
            fs.writeFileSync(filePath, file.buffer);
            
            // Формуємо URL (відносний шлях)
            const imageUrl = `/uploads/${WIKI_FOLDER}/${entityType}/${fileName}`;
            
            // Оновлюємо запис в БД
            await this.updateEntityImageUrl(entityType, entityId, imageUrl);
            
            return { imageUrl };
        } catch (error) {
            console.error('❌ Error uploading image:', error);
            throw new Error('Failed to upload image');
        }
    }
    
    /**
     * Видалити зображення
     */
    async deleteEntityImage(
        entityType: string,
        entityId: number
    ): Promise<void> {
        try {
            // Отримуємо поточний URL
            const currentUrl = await this.getEntityImageUrl(entityType, entityId);
            
            if (currentUrl) {
                // Видаляємо файл
                const filePath = path.join(UPLOAD_DIR, '..', currentUrl);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                
                // Очищаємо URL в БД
                await this.updateEntityImageUrl(entityType, entityId, null);
            }
        } catch (error) {
            console.error('❌ Error deleting image:', error);
            throw new Error('Failed to delete image');
        }
    }
    
    /**
     * Оновити image_url в базі даних
     */
    private async updateEntityImageUrl(
        entityType: string,
        entityId: number,
        imageUrl: string | null
    ): Promise<void> {
        const tableName = this.getTableName(entityType);
        
        await pool.execute(
            `UPDATE \`${tableName}\` SET image_url = ? WHERE id = ?`,
            [imageUrl, entityId]
        );
    }
    
    /**
     * Отримати image_url з бази даних
     */
    private async getEntityImageUrl(
        entityType: string,
        entityId: number
    ): Promise<string | null> {
        const tableName = this.getTableName(entityType);
        
        const [rows] = await pool.execute(
            `SELECT image_url FROM \`${tableName}\` WHERE id = ?`,
            [entityId]
        ) as any;
        
        return rows[0]?.image_url || null;
    }
    
    /**
     * Отримати назву таблиці за типом сутності
     */
    private getTableName(entityType: string): string {
        const tableMap: Record<string, string> = {
            'guard-type': 'guard_type',
            'pommel': 'pommel',
            'sharpening': 'sharpening'
        };
        
        return tableMap[entityType] || entityType;
    }
}
