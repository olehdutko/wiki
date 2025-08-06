/**
 * Головний Express сервер для енциклопедії холодної зброї
 */

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { testConnection } from './config/database.config';
import apiRoutes from './routes/api.routes';

// Завантаження змінних середовища
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ================= MIDDLEWARE =================

// Безпека
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS - дозволяємо запити з фронтенду
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Парсинг JSON та URL-encoded даних
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логування запитів (простий варіант)
app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.connection.remoteAddress;

    console.log(`[${timestamp}] ${method} ${url} - ${ip}`);
    next();
});

// ================= РОУТИ =================

// API роути
app.use('/api', apiRoutes);

// Головна сторінка
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'Ласкаво просимо до API енциклопедії холодної зброї!',
        version: '1.0.0',
        documentation: '/api/info',
        health: '/api/health'
    });
});

// ================= ОБРОБКА ПОМИЛОК =================

// 404 - Сторінка не знайдена
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint не знайдено',
        error: 'NOT_FOUND',
        requested: req.originalUrl
    });
});

// Глобальний обробник помилок
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Неочікувана помилка:', err);

    // Якщо заголовки вже відправлено, передаємо помилку Express
    if (res.headersSent) {
        return next(err);
    }

    // Типові помилки
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'Файл занадто великий',
            error: 'FILE_TOO_LARGE'
        });
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'Невірний JSON формат',
            error: 'INVALID_JSON'
        });
    }

    // Загальна помилка сервера
    res.status(500).json({
        success: false,
        message: 'Внутрішня помилка сервера',
        error: process.env.NODE_ENV === 'development' ? err.message : 'INTERNAL_SERVER_ERROR'
    });
});

// ================= ЗАПУСК СЕРВЕРА =================

async function startServer() {
    try {
        // Тестуємо підключення до бази даних
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('❌ Не вдалося підключитися до бази даних. Сервер не запущено.');
            process.exit(1);
        }

        // Запускаємо сервер
        const server = app.listen(PORT, () => {
            console.log('=================================');
            console.log('🚀 Сервер успішно запущено!');
            console.log(`📍 Адреса: http://localhost:${PORT}`);
            console.log(`🔧 Середовище: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📚 API документація: http://localhost:${PORT}/api/info`);
            console.log(`💚 Здоров'я API: http://localhost:${PORT}/api/health`);
            console.log('=================================');
        });

        // Graceful shutdown
        const gracefulShutdown = (signal: string) => {
            console.log(`\n🛑 Отримано сигнал ${signal}. Зупиняємо сервер...`);

            server.close(() => {
                console.log('📴 HTTP сервер зупинено');
                console.log('👋 Сервер успішно зупинено');
                process.exit(0);
            });

            // Форсоване зупинення через 10 секунд
            setTimeout(() => {
                console.log('⚠️ Форсоване зупинення сервера');
                process.exit(1);
            }, 10000);
        };

        // Обробники сигналів
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Обробка неперехоплених помилок
        process.on('uncaughtException', (error) => {
            console.error('❌ Неперехоплена помилка:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Неперехоплене відхилення Promise:', reason);
            console.error('Promise:', promise);
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Помилка при запуску сервера:', error);
        process.exit(1);
    }
}

// Запускаємо сервер
startServer(); 