
/**
 * Audit log service for item changes
 */

import { pool } from '../config/database.config';
import type { RowDataPacket } from 'mysql2';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogEntry extends RowDataPacket {
    id: number;
    item_id: number;
    action: AuditAction;
    field_name: string | null;
    old_value: string | null;
    new_value: string | null;
    changed_by: string | null;
    changed_at: string;
    restored_at: string | null;
    restored_by: string | null;
}

export interface AuditLogChange {
    fieldName: string;
    oldValue: any;
    newValue: any;
}

const DEFAULT_CHANGED_BY = 'Лея';

/**
 * Serialize a value for storage. Arrays/objects become JSON; null/undefined become null.
 */
function serializeValue(value: any): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
}

/**
 * Compare two plain objects and return changed fields.
 * Nested objects/arrays are compared by JSON serialization.
 */
function diffObjects<T extends Record<string, any>>(oldObj: T, newObj: T): AuditLogChange[] {
    const changes: AuditLogChange[] = [];
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

    for (const key of allKeys) {
        const oldValue = oldObj?.[key];
        const newValue = newObj?.[key];

        if (oldValue === newValue) continue;

        const oldSerialized = serializeValue(oldValue);
        const newSerialized = serializeValue(newValue);

        if (oldSerialized === newSerialized) continue;

        changes.push({ fieldName: key, oldValue: oldSerialized, newValue: newSerialized });
    }

    return changes;
}

/**
 * Strip internal/derived fields before diffing or logging a full snapshot.
 */
function stripInternalFields(data: Record<string, any>): Record<string, any> {
    const copy = { ...data };
    const fieldsToRemove = [
        'id',
        'created_at',
        'updated_at',
        'timestamp',
        'category_ids',
        'territory_ids',
        'categories',
        'territories',
        'images',
        'linkedObjects',
        'primary_image_url',
        'item_count',
        // Derived imperial-unit fields are auto-computed; only log the source metric values
        'total_len_in',
        'blade_len_in',
        'handle_len_in',
        'handle_len_w_in',
        'width_in',
        'guard_width_in',
        'thikness_in',
        'weight_lb'
    ];
    for (const field of fieldsToRemove) {
        delete copy[field];
    }
    return copy;
}

export class AuditLogService {
    /**
     * Log creation of a new item.
     */
    async logCreate(
        itemId: number,
        newData: Record<string, any>,
        changedBy: string = DEFAULT_CHANGED_BY
    ): Promise<void> {
        const cleanNewData = stripInternalFields(newData);
        await this.insert({
            itemId,
            action: 'CREATE',
            fieldName: null,
            oldValue: null,
            newValue: JSON.stringify(cleanNewData),
            changedBy
        });
    }

    /**
     * Log update of an item. Only changed fields are recorded.
     */
    async logUpdate(
        itemId: number,
        oldData: Record<string, any>,
        newData: Record<string, any>,
        changedBy: string = DEFAULT_CHANGED_BY
    ): Promise<void> {
        const cleanOldData = stripInternalFields(oldData);
        const cleanNewData = stripInternalFields(newData);
        const changes = diffObjects(cleanOldData, cleanNewData);

        if (changes.length === 0) return;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            for (const change of changes) {
                await connection.execute(
                    `INSERT INTO item_audit_logs
                     (item_id, action, field_name, old_value, new_value, changed_by)
                     VALUES (?, 'UPDATE', ?, ?, ?, ?)`,
                    [itemId, change.fieldName, change.oldValue, change.newValue, changedBy]
                );
            }
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Log deletion of an item.
     */
    async logDelete(
        itemId: number,
        oldData: Record<string, any>,
        changedBy: string = DEFAULT_CHANGED_BY
    ): Promise<void> {
        const cleanOldData = stripInternalFields(oldData);
        await this.insert({
            itemId,
            action: 'DELETE',
            fieldName: null,
            oldValue: JSON.stringify(cleanOldData),
            newValue: null,
            changedBy
        });
    }

    /**
     * Log a relationship change (categories, territories, links) as a single audit entry.
     */
    async logRelationChange(
        itemId: number,
        relationName: string,
        oldValue: any,
        newValue: any,
        changedBy: string = DEFAULT_CHANGED_BY
    ): Promise<void> {
        const oldSerialized = serializeValue(oldValue);
        const newSerialized = serializeValue(newValue);
        if (oldSerialized === newSerialized) return;

        await this.insert({
            itemId,
            action: 'UPDATE',
            fieldName: relationName,
            oldValue: oldSerialized,
            newValue: newSerialized,
            changedBy
        });
    }

    /**
     * Get all audit log entries for an item, newest first.
     */
    async getByItemId(itemId: number): Promise<AuditLogEntry[]> {
        const [rows] = await pool.execute(
            `SELECT * FROM item_audit_logs WHERE item_id = ? ORDER BY changed_at DESC, id DESC`,
            [itemId]
        ) as [AuditLogEntry[], any];
        return rows;
    }

    private async insert(params: {
        itemId: number;
        action: AuditAction;
        fieldName: string | null;
        oldValue: string | null;
        newValue: string | null;
        changedBy: string;
    }): Promise<void> {
        await pool.execute(
            `INSERT INTO item_audit_logs
             (item_id, action, field_name, old_value, new_value, changed_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [params.itemId, params.action, params.fieldName, params.oldValue, params.newValue, params.changedBy]
        );
    }

    /**
     * Mark an audit log entry as restored.
     */
    async markRestored(logId: number, restoredBy: string = DEFAULT_CHANGED_BY): Promise<void> {
        await pool.execute(
            `UPDATE item_audit_logs SET restored_at = NOW(), restored_by = ? WHERE id = ?`,
            [restoredBy, logId]
        );
    }

    /**
     * Get a single audit log entry by ID.
     */
    async getById(logId: number): Promise<AuditLogEntry | null> {
        const [rows] = await pool.execute(
            `SELECT * FROM item_audit_logs WHERE id = ?`,
            [logId]
        ) as [AuditLogEntry[], any];
        return rows[0] || null;
    }
}

export const auditLogService = new AuditLogService();

