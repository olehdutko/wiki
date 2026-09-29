
/**
 * Audit log controller
 */

import { Request, Response } from 'express';
import { auditLogService } from '../services/auditLog.service';
import { weaponItemService } from '../services/entities.services';

export class AuditLogController {
    async getItemAuditLogs(req: Request, res: Response): Promise<void> {
        try {
            const itemId = parseInt(req.params.id, 10);
            if (isNaN(itemId)) {
                res.status(400).json({
                    success: false,
                    message: 'Невірний формат ID айтема'
                });
                return;
            }

            const logs = await auditLogService.getByItemId(itemId);

            res.status(200).json({
                success: true,
                data: logs,
                message: 'Історію змін успішно отримано'
            });
        } catch (error) {
            console.error('Помилка при отриманні аудит-логів:', error);
            res.status(500).json({
                success: false,
                message: 'Не вдалося отримати історію змін',
                error: error instanceof Error ? error.message : 'Невідома помилка'
            });
        }
    }

    async restoreAuditLog(req: Request, res: Response): Promise<void> {
        try {
            const itemId = parseInt(req.params.id, 10);
            const logId = parseInt(req.params.logId, 10);

            if (isNaN(itemId) || isNaN(logId)) {
                res.status(400).json({
                    success: false,
                    message: 'Невірний формат ID'
                });
                return;
            }

            const log = await auditLogService.getById(logId);
            if (!log || log.item_id !== itemId) {
                res.status(404).json({
                    success: false,
                    message: 'Запис аудит-логу не знайдено'
                });
                return;
            }

            if (log.restored_at) {
                res.status(409).json({
                    success: false,
                    message: 'Ця зміна вже відновлена'
                });
                return;
            }

            if (log.action !== 'UPDATE' || !log.field_name) {
                res.status(400).json({
                    success: false,
                    message: 'Відновлення можливе лише для записів про зміну полів'
                });
                return;
            }

            const restoredBy = 'odutko';

            let oldValue: any = log.old_value;
            try {
                if (oldValue) oldValue = JSON.parse(oldValue);
            } catch {
                // keep as string
            }

            await weaponItemService.restoreField(itemId, log.field_name, oldValue, restoredBy);
            await auditLogService.markRestored(logId, restoredBy);

            res.status(200).json({
                success: true,
                message: 'Зміну успішно відновлено'
            });
        } catch (error) {
            console.error('Помилка при відновленні аудит-логу:', error);
            res.status(500).json({
                success: false,
                message: 'Не вдалося відновити зміну',
                error: error instanceof Error ? error.message : 'Невідома помилка'
            });
        }
    }
}

