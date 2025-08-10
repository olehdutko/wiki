-- Тестовий скрипт для перевірки оновлення в таблиці guard_type

-- 1. Перевіряємо структуру таблиці
DESCRIBE guard_type;

-- 2. Перевіряємо поточні дані
SELECT * FROM guard_type WHERE id = 18;

-- 3. Тестуємо оновлення
UPDATE guard_type SET rus = 'TEST_UPDATE' WHERE id = 18;

-- 4. Перевіряємо результат
SELECT * FROM guard_type WHERE id = 18;

-- 5. Відновлюємо оригінальне значення
UPDATE guard_type SET rus = NULL WHERE id = 18;

-- 6. Фінальна перевірка
SELECT * FROM guard_type WHERE id = 18; 