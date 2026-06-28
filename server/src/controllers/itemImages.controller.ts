/**
 * Контролер для зображень айтемів
 */

import { Request, Response } from 'express';
import { ItemImagesService } from '../services/itemImages.service';
import { getItemImageUrl } from '../services/itemImages.service';
import { pool } from '../config/database.config';

export class ItemImagesController {
    private itemImagesService: ItemImagesService;

    constructor() {
        this.itemImagesService = new ItemImagesService();
    }

    /**
     * Отримати інформацію про айтем для формування шляхів
     */
    private async getItemInfo(itemId: number): Promise<{
        id: number;
        eng_name?: string | null;
        ukr_name?: string | null;
        rus_name?: string | null;
    } | null> {
        const [rows] = await pool.execute(
            `SELECT id, eng_name, ukr_name, rus_name FROM items WHERE id = ?`,
            [itemId]
        ) as any;

        return rows[0] || null;
    }

    /**
     * Завантажити зображення для айтема
     */
    async uploadImages(req: Request, res: Response): Promise<void> {
        try {
            const itemId = parseInt(req.params.itemId);

            if (isNaN(itemId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid item ID'
                });
                return;
            }

            const files = (req as any).files;

            if (!files || files.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
                return;
            }

            const item = await this.getItemInfo(itemId);

            if (!item) {
                res.status(404).json({
                    success: false,
                    message: 'Item not found'
                });
                return;
            }

            const images = await this.itemImagesService.uploadImages(item, files);

            res.status(200).json({
                success: true,
                data: images.map(img => ({
                    ...img,
                    url: getItemImageUrl(item, img.file_name)
                })),
                message: `Uploaded ${images.length} image(s)`
            });
        } catch (error: any) {
            console.error('Error uploading item images:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload images'
            });
        }
    }

    /**
     * Отримати список зображень айтема
     */
    async getImages(req: Request, res: Response): Promise<void> {
        try {
            const itemId = parseInt(req.params.itemId);

            if (isNaN(itemId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid item ID'
                });
                return;
            }

            const item = await this.getItemInfo(itemId);

            if (!item) {
                res.status(404).json({
                    success: false,
                    message: 'Item not found'
                });
                return;
            }

            const images = await this.itemImagesService.getImagesByItemId(itemId);

            res.status(200).json({
                success: true,
                data: images.map(img => ({
                    ...img,
                    url: getItemImageUrl(item, img.file_name)
                }))
            });
        } catch (error: any) {
            console.error('Error getting item images:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get images'
            });
        }
    }

    /**
     * Встановити primary зображення
     */
    async setPrimary(req: Request, res: Response): Promise<void> {
        try {
            const itemId = parseInt(req.params.itemId);
            const imageId = parseInt(req.params.imageId);

            if (isNaN(itemId) || isNaN(imageId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid item ID or image ID'
                });
                return;
            }

            await this.itemImagesService.setPrimaryImage(itemId, imageId);

            res.status(200).json({
                success: true,
                message: 'Primary image updated'
            });
        } catch (error: any) {
            console.error('Error setting primary image:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to set primary image'
            });
        }
    }

    /**
     * Видалити зображення
     */
    async deleteImage(req: Request, res: Response): Promise<void> {
        try {
            const itemId = parseInt(req.params.itemId);
            const imageId = parseInt(req.params.imageId);

            if (isNaN(itemId) || isNaN(imageId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid item ID or image ID'
                });
                return;
            }

            await this.itemImagesService.deleteImage(itemId, imageId);

            res.status(200).json({
                success: true,
                message: 'Image deleted'
            });
        } catch (error: any) {
            console.error('Error deleting item image:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete image'
            });
        }
    }
}
