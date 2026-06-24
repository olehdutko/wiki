/**
 * Контролер для завантаження зображень
 */

import { Request, Response } from 'express';
import { UploadService } from '../services/upload.service';

export class UploadController {
    private uploadService: UploadService;

    constructor() {
        this.uploadService = new UploadService();
    }

    /**
     * Завантажити зображення для довідкової сутності
     */
    async uploadEntityImage(req: Request, res: Response): Promise<void> {
        try {
            const { entityType, entityId } = req.params;
            
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
                return;
            }

            const result = await this.uploadService.uploadEntityImage(
                entityType,
                parseInt(entityId),
                req.file
            );

            res.status(200).json({
                success: true,
                data: result,
                message: 'Image uploaded successfully'
            });
        } catch (error: any) {
            console.error('Error uploading image:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload image'
            });
        }
    }

    /**
     * Видалити зображення
     */
    async deleteEntityImage(req: Request, res: Response): Promise<void> {
        try {
            const { entityType, entityId } = req.params;

            await this.uploadService.deleteEntityImage(
                entityType,
                parseInt(entityId)
            );

            res.status(200).json({
                success: true,
                message: 'Image deleted successfully'
            });
        } catch (error: any) {
            console.error('Error deleting image:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete image'
            });
        }
    }
}
