import { Request, Response } from 'express';
import { pool } from '../config/database.config';
import type { RowDataPacket } from 'mysql2';

interface LinkedObject extends RowDataPacket {
    id: number;
    item_id: number;
    ukr_name: string;
    eng_name: string;
    rus_name: string;
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

            // Отримуємо всі пов'язані об'єкти через таблицю links
            const [rows] = await pool.query<LinkedObject[]>(`
                SELECT 
                    l.id,
                    i.id as item_id,
                    i.ukr_name,
                    i.eng_name,
                    i.rus_name
                FROM 
                    links l
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

            const [result] = await pool.execute(
                'DELETE FROM links WHERE id = ?',
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
} 