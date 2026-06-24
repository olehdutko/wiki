/**
 * Сервіс для завантаження зображень в AWS S3
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.config';
import dotenv from 'dotenv';

dotenv.config();

// AWS S3 конфігурація
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'weaponry-images';
const WIKI_FOLDER = 'wiki';

export class UploadService {
    /**
     * Завантажити зображення для довідкової сутності
     */
    async uploadEntityImage(
        entityType: string,
        entityId: number,
        file: Express.Multer.File
    ): Promise<{ imageUrl: string }> {
        try {
            // Генеруємо унікальне ім'я файлу
            const fileExtension = file.originalname.split('.').pop() || 'jpg';
            const fileName = `${entityType}_${entityId}_${uuidv4()}.${fileExtension}`;
            const s3Key = `${WIKI_FOLDER}/${entityType}/${fileName}`;

            // Завантажуємо в S3
            const uploadParams = {
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read' as const
            };

            await s3Client.send(new PutObjectCommand(uploadParams));

            // Формуємо URL
            const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${s3Key}`;

            // Оновлюємо запис в БД
            await this.updateEntityImageUrl(entityType, entityId, imageUrl);

            return { imageUrl };
        } catch (error) {
            console.error('❌ Error uploading to S3:', error);
            throw new Error('Failed to upload image');
        }
    }

    /**
     * Видалити зображення з S3
     */
    async deleteEntityImage(
        entityType: string,
        entityId: number
    ): Promise<void> {
        try {
            // Отримуємо поточний URL
            const currentUrl = await this.getEntityImageUrl(entityType, entityId);
            
            if (currentUrl) {
                // Видаляємо з S3
                const s3Key = currentUrl.split('.amazonaws.com/')[1];
                if (s3Key) {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: BUCKET_NAME,
                        Key: s3Key
                    }));
                }

                // Очищаємо URL в БД
                await this.updateEntityImageUrl(entityType, entityId, null);
            }
        } catch (error) {
            console.error('❌ Error deleting from S3:', error);
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
            'guard_type': 'guard_type',
            'apple': 'apple',
            'sharpening': 'sharpening'
        };

        return tableMap[entityType] || entityType;
    }
}
