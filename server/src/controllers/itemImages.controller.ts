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
     * Встановити флаг show для зображення
     */
    async setShow(req: Request, res: Response): Promise<void> {
        try {
            const itemId = parseInt(req.params.itemId);
            const imageId = parseInt(req.params.imageId);
            const show = req.body.show === true;

            if (isNaN(itemId) || isNaN(imageId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid item ID or image ID'
                });
                return;
            }

            await this.itemImagesService.setShowImage(itemId, imageId, show);

            res.status(200).json({
                success: true,
                message: 'Image visibility updated'
            });
        } catch (error: any) {
            console.error('Error setting image show flag:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update image visibility'
            });
        }
    }

    /**
     * Змінити порядок зображень
     */
    async reorderImages(req: Request, res: Response): Promise<void> {
        try {
            const itemId = parseInt(req.params.itemId);
            const { orderedIds } = req.body;

            if (isNaN(itemId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid item ID'
                });
                return;
            }

            if (!Array.isArray(orderedIds) || orderedIds.length === 0 || !orderedIds.every(id => Number.isInteger(id))) {
                res.status(400).json({
                    success: false,
                    message: 'orderedIds must be a non-empty array of integers'
                });
                return;
            }

            await this.itemImagesService.reorderImages(itemId, orderedIds);

            res.status(200).json({
                success: true,
                message: 'Image order updated'
            });
        } catch (error: any) {
            console.error('Error reordering item images:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to reorder images'
            });
        }
    }

    /**
     * Оновити коментар до зображення
     */
    async updateComment(req: Request, res: Response): Promise<void> {
        try {
            const itemId = parseInt(req.params.itemId);
            const imageId = parseInt(req.params.imageId);
            const { comment } = req.body;

            if (isNaN(itemId) || isNaN(imageId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid item ID or image ID'
                });
                return;
            }

            if (comment !== undefined && comment !== null && typeof comment !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Comment must be a string'
                });
                return;
            }

            if (comment !== undefined && comment !== null && comment.length > 1000) {
                res.status(400).json({
                    success: false,
                    message: 'Comment must be at most 1000 characters'
                });
                return;
            }

            await this.itemImagesService.updateComment(itemId, imageId, comment || null);

            res.status(200).json({
                success: true,
                message: 'Image comment updated'
            });
        } catch (error: any) {
            console.error('Error updating image comment:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update image comment'
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
