import { useState, useEffect } from 'react';
import { EditEntityForm } from './EditEntityForm';
import { apiService } from '../../services/api.service';
import type { EntityType } from '../../types/api.types';

interface BaseEntity {
    id: number;
}

interface CreateEntityFormProps<T extends BaseEntity> {
    open: boolean;
    entityType: EntityType;
    onClose: () => void;
    onSave: (newEntity: T) => void;
}

export function CreateEntityForm<T extends BaseEntity>({
    open,
    entityType,
    onClose,
    onSave
}: CreateEntityFormProps<T>) {
    const [maxId, setMaxId] = useState<number>(0);

    useEffect(() => {
        if (open) {
            // При відкритті форми отримуємо максимальний ID
            apiService.getMaxId(entityType).then(id => {
                console.log('✅ Отримано максимальний ID:', id);
                setMaxId(id);
            });
        }
    }, [open, entityType]);

    // Створюємо порожній об'єкт для нової сутності з ID = maxId + 1
    const emptyEntity = { id: maxId + 1 } as T;

    return (
        <EditEntityForm
            open={open}
            entity={emptyEntity}
            entityType={entityType}
            onClose={onClose}
            onSave={onSave}
            mode="create"
            headerColor="linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)"
            saveButtonText="Додати"
        />
    );
} 