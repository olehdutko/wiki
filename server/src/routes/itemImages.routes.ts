/**
 * API роути для зображень айтемів
 */

import { Router } from 'express';
import multer from 'multer';
import { ItemImagesController } from '../controllers/itemImages.controller';

const router = Router();
const itemImagesController = new ItemImagesController();

// Налаштування multer для зберігання в пам'яті
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only JPG/PNG images are allowed'));
        }
    }
});

// GET /api/items/:itemId/images — список зображень
router.get('/:itemId/images', itemImagesController.getImages.bind(itemImagesController));

// POST /api/items/:itemId/images — завантаження масиву файлів
router.post('/:itemId/images', upload.array('images', 50), itemImagesController.uploadImages.bind(itemImagesController));

// PATCH /api/items/:itemId/images/:imageId/primary — встановити primary
router.patch('/:itemId/images/:imageId/primary', itemImagesController.setPrimary.bind(itemImagesController));

// PATCH /api/items/:itemId/images/:imageId/show — встановити флаг show
router.patch('/:itemId/images/:imageId/show', itemImagesController.setShow.bind(itemImagesController));

// DELETE /api/items/:itemId/images/:imageId — видалити зображення
router.delete('/:itemId/images/:imageId', itemImagesController.deleteImage.bind(itemImagesController));

export default router;
