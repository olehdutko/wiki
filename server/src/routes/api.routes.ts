/**
 * API роути для всіх сутностей
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
    PommelController, BladeTypeController, CategoryController, TerritoryController, DollsController,
    EpohaController, GlobalTypeController, GuardTypeController, SharpeningController,
    UsageController, WeaponItemController
} from '../controllers/entities.controllers';
import { LinksController } from '../controllers/links.controller';
import { exportDatabaseDump } from '../controllers/database.controller';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller';
import itemImagesRoutes from '../routes/itemImages.routes';

const router = Router();

// ================= ІНСТАНЦІЇ КОНТРОЛЕРІВ =================

const pommelController = new PommelController();
const bladeTypeController = new BladeTypeController();
const categoryController = new CategoryController();
const territoryController = new TerritoryController();
const dollsController = new DollsController();
const epohaController = new EpohaController();
const globalTypeController = new GlobalTypeController();
const guardTypeController = new GuardTypeController();
const sharpeningController = new SharpeningController();
const usageController = new UsageController();
const weaponItemController = new WeaponItemController();
const linksController = new LinksController();

// ================= ВАЛІДАТОРИ =================

const namedEntityValidation = [
    body('ukr').notEmpty().withMessage('Українська назва обов\'язкова').isString().isLength({ max: 100 }),
    body('eng').optional().isString().isLength({ max: 100 }),
    body('rus').optional().isString().isLength({ max: 100 })
];

// Валідація для часткового оновлення (inline редагування)
const namedEntityUpdateValidation = [
    body('ukr').optional().isString().isLength({ max: 100 }),
    body('eng').optional().isString().isLength({ max: 100 }),
    body('rus').optional().isString().isLength({ max: 100 })
];

// Валідація для навершь (pommel)
const pommelValidation = [
    body('ukr').notEmpty().withMessage('Українська назва обов\'язкова').isString().isLength({ max: 100 }),
    body('eng').optional().isString().isLength({ max: 100 }),
    body('type').optional().isString().isLength({ max: 10 }),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('rus').optional().isString().isLength({ max: 100 })
];

const pommelUpdateValidation = [
    body('ukr').optional().isString().isLength({ max: 100 }),
    body('eng').optional().isString().isLength({ max: 100 }),
    body('type').optional().isString().isLength({ max: 10 }),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('rus').optional().isString().isLength({ max: 100 })
];

const categoryValidation = [
    body('ukr_name').notEmpty().withMessage('Українська назва обов\'язкова').isString().isLength({ max: 300 }),
    body('eng_name').optional().isString().isLength({ max: 300 }),
    body('comments').optional().isString().isLength({ max: 800 })
];

const territoryValidation = [
    body('ukr_name').notEmpty().withMessage('Українська назва обов\'язкова').isString().isLength({ max: 300 }),
    body('eng_name').optional().isString().isLength({ max: 300 }),
    body('rus_name').optional().isString().isLength({ max: 300 })
];

// Валідація для часткового оновлення категорій
const categoryUpdateValidation = [
    body('ukr_name').optional().isString().isLength({ max: 300 }),
    body('eng_name').optional().isString().isLength({ max: 300 }),
    body('comments').optional().isString().isLength({ max: 800 })
];

const territoryUpdateValidation = [
    body('ukr_name').optional().isString().isLength({ max: 300 }),
    body('eng_name').optional().isString().isLength({ max: 300 }),
    body('rus_name').optional().isString().isLength({ max: 300 })
];

const weaponItemValidation = [
    body('ready').custom((value) => {
        // Конвертуємо різні типи значень в boolean
        if (value === 'true' || value === true || value === 1) {
            return true;
        }
        if (value === 'false' || value === false || value === 0 || value === '' || value === null || value === undefined) {
            return false;
        }
        throw new Error('ready must be a boolean value');
    }),
    body('description_ukr').optional().isString().isLength({ max: 6300 }),
    body('description_eng').optional().isString().isLength({ max: 6300 }),
    body('description_rus').optional().isString().isLength({ max: 6300 }),
    body('ukr_name').optional().isString().isLength({ max: 120 }),
    body('eng_name').optional().isString().isLength({ max: 120 }),
    body('rus_name').optional().isString().isLength({ max: 120 }),
    body('handle_len').optional().isString().isLength({ max: 25 }),
    body('handle_len_w').notEmpty().isString().isLength({ max: 10 }),
    body('total_len').optional().isString().isLength({ max: 25 }),
    body('blade_len').optional().isString().isLength({ max: 25 }),
    body('width').optional().isString().isLength({ max: 25 }),
    body('guard_width').optional().isString().isLength({ max: 20 }),
    body('thikness').optional().isString().isLength({ max: 25 }),
    body('weight').optional().isString().isLength({ max: 25 }),
    body('theritory').optional().isString().isLength({ max: 100 }),
    body('century').optional().isString().isLength({ max: 25 }),
    body('arch_period').optional().isString().isLength({ max: 50 }),
    body('epoha').optional().isString().isLength({ max: 50 }),
    body('guard_type').optional().isString().isLength({ max: 20 }),
    body('blade_type').optional().isString().isLength({ max: 20 }),
    body('global_type').optional().isString().isLength({ max: 20 }),
    body('dolls').optional().isString().isLength({ max: 10 }),
    body('using_it').optional().isString().isLength({ max: 50 }),
    body('sharpening').optional().isString().isLength({ max: 10 }),
    body('pommel').optional().isString().isLength({ max: 20 }),
    body('links').optional().isString().isLength({ max: 1500 }),
    body('comments').optional().isString().isLength({ max: 800 }),
    body('source').notEmpty().isString().isLength({ max: 800 }),
    body('category_id').optional().isInt({ min: 1 }),
    body('category_ids').optional().isArray({ min: 1 }).custom((value) => {
        if (!Array.isArray(value)) return true;
        for (const id of value) {
            if (!Number.isInteger(id) || id < 1) {
                throw new Error('category_ids must contain positive integers');
            }
        }
        return true;
    })
];

// Валідація для часткового оновлення зброї
const weaponItemUpdateValidation = [
    body('ready').optional().custom((value) => {
        // Конвертуємо різні типи значень в boolean
        if (value === 'true' || value === true || value === 1) {
            return true;
        }
        if (value === 'false' || value === false || value === 0 || value === '' || value === null || value === undefined) {
            return false;
        }
        throw new Error('ready must be a boolean value');
    }),
    body('description_ukr').optional().isString().isLength({ max: 6300 }),
    body('description_eng').optional().isString().isLength({ max: 6300 }),
    body('description_rus').optional().isString().isLength({ max: 6300 }),
    body('ukr_name').optional().isString().isLength({ max: 120 }),
    body('eng_name').optional().isString().isLength({ max: 120 }),
    body('rus_name').optional().isString().isLength({ max: 120 }),
    body('handle_len').optional().isString().isLength({ max: 25 }),
    body('handle_len_w').optional().isString().isLength({ max: 10 }),
    body('total_len').optional().isString().isLength({ max: 25 }),
    body('blade_len').optional().isString().isLength({ max: 25 }),
    body('width').optional().isString().isLength({ max: 25 }),
    body('guard_width').optional().isString().isLength({ max: 20 }),
    body('thikness').optional().isString().isLength({ max: 25 }),
    body('weight').optional().isString().isLength({ max: 25 }),
    body('theritory').optional().isString().isLength({ max: 100 }),
    body('century').optional().isString().isLength({ max: 25 }),
    body('arch_period').optional().isString().isLength({ max: 50 }),
    body('epoha').optional().isString().isLength({ max: 50 }),
    body('guard_type').optional().isString().isLength({ max: 20 }),
    body('blade_type').optional().isString().isLength({ max: 20 }),
    body('global_type').optional().isString().isLength({ max: 20 }),
    body('dolls').optional().isString().isLength({ max: 10 }),
    body('using_it').optional().isString().isLength({ max: 50 }),
    body('sharpening').optional().isString().isLength({ max: 10 }),
    body('pommel').optional().isString().isLength({ max: 20 }),
    body('links').optional().isString().isLength({ max: 1500 }),
    body('comments').optional().isString().isLength({ max: 800 }),
    body('source').optional().isString().isLength({ max: 800 }),
    body('category_id').optional().isInt({ min: 1 }),
    body('category_ids').optional().isArray().custom((value) => {
        if (!Array.isArray(value)) return true;
        for (const id of value) {
            if (!Number.isInteger(id) || id < 1) {
                throw new Error('category_ids must contain positive integers');
            }
        }
        return true;
    })
];

// ================= БАЗОВІ CRUD РОУТИ ДЛЯ ДОВІДКОВИХ СУТНОСТЕЙ =================

// Global Type (глобальні типи)
router.get('/global-type', globalTypeController.getAll.bind(globalTypeController));
router.get('/global-type/search', globalTypeController.search.bind(globalTypeController));
router.get('/global-type/count', globalTypeController.getCount.bind(globalTypeController));
router.get('/global-type/max-id', globalTypeController.getMaxId.bind(globalTypeController));
router.get('/global-type/:id', globalTypeController.getById.bind(globalTypeController));
router.post('/global-type', namedEntityValidation, globalTypeController.create.bind(globalTypeController));
router.put('/global-type/:id', namedEntityUpdateValidation, globalTypeController.update.bind(globalTypeController));
router.delete('/global-type/:id', globalTypeController.delete.bind(globalTypeController));

// Guard Type (типи гард)
router.get('/guard-type', guardTypeController.getAll.bind(guardTypeController));
router.get('/guard-type/search', guardTypeController.search.bind(guardTypeController));
router.get('/guard-type/count', guardTypeController.getCount.bind(guardTypeController));
router.get('/guard-type/max-id', guardTypeController.getMaxId.bind(guardTypeController));
router.get('/guard-type/:id', guardTypeController.getById.bind(guardTypeController));
router.post('/guard-type', namedEntityValidation, guardTypeController.create.bind(guardTypeController));
router.put('/guard-type/:id', namedEntityUpdateValidation, guardTypeController.update.bind(guardTypeController));
router.delete('/guard-type/:id', guardTypeController.delete.bind(guardTypeController));

// Blade Type (типи клинків)
router.get('/blade-type', bladeTypeController.getAll.bind(bladeTypeController));
router.get('/blade-type/search', bladeTypeController.search.bind(bladeTypeController));
router.get('/blade-type/count', bladeTypeController.getCount.bind(bladeTypeController));
router.get('/blade-type/max-id', bladeTypeController.getMaxId.bind(bladeTypeController));
router.get('/blade-type/:id', bladeTypeController.getById.bind(bladeTypeController));
router.post('/blade-type', namedEntityValidation, bladeTypeController.create.bind(bladeTypeController));
router.put('/blade-type/:id', namedEntityUpdateValidation, bladeTypeController.update.bind(bladeTypeController));
router.delete('/blade-type/:id', bladeTypeController.delete.bind(bladeTypeController));

// Apple (яблука - навершя)
router.get('/pommel', pommelController.getAll.bind(pommelController));
router.get('/pommel/search', pommelController.search.bind(pommelController));
router.get('/pommel/count', pommelController.getCount.bind(pommelController));
router.get('/pommel/max-id', pommelController.getMaxId.bind(pommelController));
router.get('/pommel/:id', pommelController.getById.bind(pommelController));
router.post('/pommel', pommelValidation, pommelController.create.bind(pommelController));
router.put('/pommel/:id', pommelUpdateValidation, pommelController.update.bind(pommelController));
router.delete('/pommel/:id', pommelController.delete.bind(pommelController));

// Dolls (доли)
router.get('/dolls', dollsController.getAll.bind(dollsController));
router.get('/dolls/search', dollsController.search.bind(dollsController));
router.get('/dolls/count', dollsController.getCount.bind(dollsController));
router.get('/dolls/max-id', dollsController.getMaxId.bind(dollsController));
router.get('/dolls/:id', dollsController.getById.bind(dollsController));
router.post('/dolls', namedEntityValidation, dollsController.create.bind(dollsController));
router.put('/dolls/:id', namedEntityUpdateValidation, dollsController.update.bind(dollsController));
router.delete('/dolls/:id', dollsController.delete.bind(dollsController));

// Epoha (епохи)
router.get('/epoha', epohaController.getAll.bind(epohaController));
router.get('/epoha/search', epohaController.search.bind(epohaController));
router.get('/epoha/count', epohaController.getCount.bind(epohaController));
router.get('/epoha/max-id', epohaController.getMaxId.bind(epohaController));
router.get('/epoha/:id', epohaController.getById.bind(epohaController));
router.post('/epoha', namedEntityValidation, epohaController.create.bind(epohaController));
router.put('/epoha/:id', namedEntityUpdateValidation, epohaController.update.bind(epohaController));
router.delete('/epoha/:id', epohaController.delete.bind(epohaController));

// Sharpening (заточення)
router.get('/sharpening', sharpeningController.getAll.bind(sharpeningController));
router.get('/sharpening/search', sharpeningController.search.bind(sharpeningController));
router.get('/sharpening/count', sharpeningController.getCount.bind(sharpeningController));
router.get('/sharpening/max-id', sharpeningController.getMaxId.bind(sharpeningController));
router.get('/sharpening/:id', sharpeningController.getById.bind(sharpeningController));
router.post('/sharpening', namedEntityValidation, sharpeningController.create.bind(sharpeningController));
router.put('/sharpening/:id', namedEntityUpdateValidation, sharpeningController.update.bind(sharpeningController));
router.delete('/sharpening/:id', sharpeningController.delete.bind(sharpeningController));

// Usage (використання)
router.get('/usage', usageController.getAll.bind(usageController));
router.get('/usage/search', usageController.search.bind(usageController));
router.get('/usage/count', usageController.getCount.bind(usageController));
router.get('/usage/max-id', usageController.getMaxId.bind(usageController));
router.get('/usage/:id', usageController.getById.bind(usageController));
router.post('/usage', namedEntityValidation, usageController.create.bind(usageController));
router.put('/usage/:id', namedEntityUpdateValidation, usageController.update.bind(usageController));
router.delete('/usage/:id', usageController.delete.bind(usageController));

// Categories (категорії)
router.get('/categories', categoryController.getAll.bind(categoryController));
router.get('/categories/search', categoryController.search.bind(categoryController));
router.get('/categories/count', categoryController.getCount.bind(categoryController));
router.get('/categories/max-id', categoryController.getMaxId.bind(categoryController));
router.get('/categories/:id', categoryController.getById.bind(categoryController));
router.post('/categories', categoryValidation, categoryController.create.bind(categoryController));
router.put('/categories/:id', categoryUpdateValidation, categoryController.update.bind(categoryController));
router.delete('/categories/:id', categoryController.delete.bind(categoryController));

// ================= МАРШРУТИ ТЕРИТОРІЙ =================
router.get('/territories', territoryController.getAll.bind(territoryController));
router.get('/territories/search', territoryController.search.bind(territoryController));
router.get('/territories/count', territoryController.getCount.bind(territoryController));
router.get('/territories/max-id', territoryController.getMaxId.bind(territoryController));
router.get('/territories/:id', territoryController.getById.bind(territoryController));
router.post('/territories', territoryValidation, territoryController.create.bind(territoryController));
router.put('/territories/:id', territoryUpdateValidation, territoryController.update.bind(territoryController));
router.delete('/territories/:id', territoryController.delete.bind(territoryController));

// ================= ГОЛОВНА СУТНІСТЬ - WEAPON ITEMS =================

// Основні CRUD операції
router.get('/weapons', weaponItemController.getAllWithCategory.bind(weaponItemController));
router.get('/weapons/search', weaponItemController.searchWeapons.bind(weaponItemController));
router.get('/weapons/count', weaponItemController.getCount.bind(weaponItemController));
router.get('/weapons/max-id', weaponItemController.getMaxId.bind(weaponItemController));
router.get('/weapons/category/:categoryId', weaponItemController.getByCategory.bind(weaponItemController));
router.get('/weapons/:id', weaponItemController.getByIdWithCategory.bind(weaponItemController));
router.post('/weapons', weaponItemValidation, weaponItemController.createWeapon.bind(weaponItemController));
router.put('/weapons/:id', weaponItemUpdateValidation, weaponItemController.updateWeapon.bind(weaponItemController));
router.delete('/weapons/:id', weaponItemController.delete.bind(weaponItemController));

// ================= РОУТИ ДЛЯ ЗВ'ЯЗКІВ =================

// Роути для лінків
// Links (звязки між айтемами)
router.get('/links/:id', linksController.getLinkedObjects.bind(linksController));
router.post('/links', linksController.createLink.bind(linksController));
router.delete('/links/:id', linksController.deleteLink.bind(linksController));

// Пошук айтемів для додавання звязків
router.get('/items/search', linksController.searchItems.bind(linksController));

// ================= ЕКСПОРТ БД (mysqldump) =================

router.get('/database/dump', exportDatabaseDump);

// ================= ЗДОРОВ'Я API =================

router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'API працює коректно',
        timestamp: new Date().toISOString()
    });
});

// ================= ІНФОРМАЦІЯ ПРО API =================

router.get('/info', (_req, res) => {
    res.json({
        success: true,
        data: {
            name: 'Weaponry Encyclopedia API',
            version: '1.0.0',
            description: 'API для енциклопедії холодної зброї',
            endpoints: {
                reference: [
                    '/api/pommel',
                    '/api/blade-type',
                    '/api/dolls',
                    '/api/epoha',
                    '/api/global-type',
                    '/api/guard-type',
                    '/api/sharpening',
                    '/api/usage'
                ],
                categories: ['/api/categories'],
                weapons: ['/api/weapons'],
                utilities: ['/api/health', '/api/info', '/api/database/dump']
            }
        }
    });
});

// ================= UPLOAD РОУТИ ДЛЯ ЗОБРАЖЕНЬ =================

const uploadController = new UploadController();

// Налаштування multer для зберігання в пам'яті
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: (_req: any, file: any, cb: any) => {
        // Дозволяємо тільки зображення
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Роути для завантаження зображень
router.post('/upload/:entityType/:entityId', upload.single('image'), uploadController.uploadEntityImage.bind(uploadController));
router.delete('/upload/:entityType/:entityId', uploadController.deleteEntityImage.bind(uploadController));

// ================= РОУТИ ДЛЯ ЗОБРАЖЕНЬ АЙТЕМІВ =================
router.use('/items', itemImagesRoutes);

export default router; 