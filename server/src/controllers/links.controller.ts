import { Request, Response } from 'express';
import { pool } from '../config/database.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface LinkedObject extends RowDataPacket {
    id: number;
    item_id: number;
    ukr_name: string;
    eng_name: string;
    rus_name: string;
}

interface SearchItem extends RowDataPacket {
    id: number;
    ukr_name: string;
    eng_name: string;
    rus_name: string;
}

interface ExistingLink extends RowDataPacket {
    count: number;
}

export class LinksController {
    async getLinkedObjects(req: Request, res: Response): Promise<void> {
        try {
            const itemId = parseInt(req.params.id);
            if (isNaN(itemId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid ID format'
                });
                return;
            }

            // Оновлено: таблиця links -> item_links
            const [rows] = await pool.query<LinkedObject[]>(`
                SELECT 
                    l.id,
                    i.id as item_id,
                    i.ukr_name,
                    i.eng_name,
                    i.rus_name
                FROM 
                    item_links l
                JOIN 
                    items i ON i.id = (
                        CASE 
                            WHEN l.item_id = ? THEN l.other_item
                            WHEN l.other_item = ? THEN l.item_id
                        END
                    )
                WHERE 
                    l.item_id = ? OR l.other_item = ?
                ORDER BY 
                    i.ukr_name ASC
            `, [itemId, itemId, itemId, itemId]);

            console.log('Знайдено пов\'язані об\'єкти:', rows);

            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Помилка при отриманні пов\'язаних об\'єктів:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async createLink(req: Request, res: Response): Promise<void> {
        try {
            const { item_id, other_item } = req.body;

            // Валідація
            if (!item_id || !other_item) {
                res.status(400).json({
                    success: false,
                    message: 'Необхідно вказати item_id та other_item'
                });
                return;
            }

            const fromId = parseInt(item_id);
            const toId = parseInt(other_item);

            if (isNaN(fromId) || isNaN(toId)) {
                res.status(400).json({
                    success: false,
                    message: 'ID мають бути числами'
                });
                return;
            }

            if (fromId === toId) {
                res.status(400).json({
                    success: false,
                    message: 'Не можна зв\'язати айтем з самим собою'
                });
                return;
            }

            // Перевіряємо чи існують обидва айтеми
            const [items] = await pool.query<RowDataPacket[]>(
                'SELECT id FROM items WHERE id IN (?, ?)',
                [fromId, toId]
            );

            if (items.length !== 2) {
                res.status(404).json({
                    success: false,
                    message: 'Один або обидва айтеми не знайдені'
                });
                return;
            }

            // Перевіряємо чи зв'язок вже існує
            const [existing] = await pool.query<ExistingLink[]>(
                `SELECT COUNT(*) as count FROM item_links 
                 WHERE (item_id = ? AND other_item = ?) 
                    OR (item_id = ? AND other_item = ?)`,
                [fromId, toId, toId, fromId]
            );

            if (existing[0].count > 0) {
                res.status(409).json({
                    success: false,
                    message: 'Зв\'язок між цими айтемами вже існує'
                });
                return;
            }

            // Створюємо зв'язок
            const [result] = await pool.execute<ResultSetHeader>(
                'INSERT INTO item_links (item_id, other_item) VALUES (?, ?)',
                [fromId, toId]
            );

            res.status(201).json({
                success: true,
                message: 'Зв\'язок успішно створено',
                data: {
                    id: result.insertId,
                    item_id: fromId,
                    other_item: toId
                }
            });
        } catch (error) {
            console.error('Помилка при створенні зв\'язку:', error);
            res.status(500).json({
                success: false,
                message: 'Помилка при створенні зв\'язку'
            });
        }
    }

    async deleteLink(req: Request, res: Response): Promise<void> {
        try {
            const linkId = parseInt(req.params.id);
            if (isNaN(linkId)) {
                res.status(400).json({
                    success: false,
                    message: 'Невірний формат ID'
                });
                return;
            }

            // Оновлено: таблиця links -> item_links
            const [result] = await pool.execute(
                'DELETE FROM item_links WHERE id = ?',
                [linkId]
            );

            const deleteResult = result as { affectedRows: number };

            if (deleteResult.affectedRows === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Лінк не знайдено'
                });
                return;
            }

            res.json({
                success: true,
                message: 'Лінк успішно видалено'
            });
        } catch (error) {
            console.error('Помилка при видаленні лінка:', error);
            res.status(500).json({
                success: false,
                message: 'Помилка при видаленні лінка'
            });
        }
    }

    async searchItems(req: Request, res: Response): Promise<void> {
        try {
            const { q } = req.query;

            if (!q || typeof q !== 'string' || q.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Пошуковий запит не може бути порожнім'
                });
                return;
            }

            const trimmedQuery = q.trim();
            const numericId = /^\d+$/.test(trimmedQuery) ? parseInt(trimmedQuery, 10) : null;

            if (numericId === null && trimmedQuery.length < 2) {
                res.status(400).json({
                    success: false,
                    message: 'Пошуковий запит має бути не менше 2 символів'
                });
                return;
            }

            const searchTerm = `%${trimmedQuery}%`;
            const params: any[] = [searchTerm, searchTerm, searchTerm];

            let idCondition = '';
            if (numericId !== null) {
                idCondition = 'OR id = ?';
                params.push(numericId);
            } else {
                idCondition = 'OR CAST(id AS CHAR) LIKE ?';
                params.push(searchTerm);
            }

            params.push(searchTerm, searchTerm, searchTerm);

            const [rows] = await pool.query<SearchItem[]>(`
                SELECT 
                    id,
                    ukr_name,
                    eng_name,
                    rus_name
                FROM 
                    items
                WHERE 
                    ukr_name LIKE ? 
                    OR eng_name LIKE ? 
                    OR rus_name LIKE ?
                    ${idCondition}
                ORDER BY 
                    CASE 
                        WHEN id = ? THEN 1
                        WHEN ukr_name LIKE ? THEN 2
                        WHEN eng_name LIKE ? THEN 3
                        ELSE 4
                    END,
                    ukr_name ASC
                LIMIT 20
            `, params);

            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Помилка при пошуку айтемів:', error);
            res.status(500).json({
                success: false,
                message: 'Помилка при пошуку айтемів'
            });
        }
    }
}
