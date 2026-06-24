/**
 * Універсальний компонент DataGrid для всіх сутностей
 */

import { useState, useEffect, useCallback } from 'react';
import {
    DataGrid,
    GridToolbar
} from '@mui/x-data-grid';
import type {
    GridColDef,
    GridRowParams
} from '@mui/x-data-grid';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Tooltip,
    Alert,

    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Check as CheckIcon,
    Close as CloseIcon
} from '@mui/icons-material';

import type {
    EntityType,
    BaseEntity
} from '../../types/api.types';
import { apiService } from '../../services/api.service';
import { getEntityConfig, type EntityConfig } from '../../config/entities.config';
import { EditEntityForm } from '../Forms/EditEntityForm';
import { CreateEntityForm } from '../Forms/CreateEntityForm';

// ================= ТИПИ =================

interface EntityDataGridProps<T extends BaseEntity> {
    entityType: EntityType;
    title?: string;
    onRowSelect?: (row: T) => void;
    onRowEdit?: (row: T) => void;

    height?: number;
    enableAdd?: boolean;
    enableEdit?: boolean;
    enableDelete?: boolean;
}

interface LoadingState {
    loading: boolean;
    error: string | null;
}

// ================= ГОЛОВНИЙ КОМПОНЕНТ =================

export function EntityDataGrid<T extends BaseEntity>({
    entityType,
    title,
    onRowSelect,
    onRowEdit,
    height = 600,
    enableAdd = true,
    enableEdit = true,
    enableDelete = true
}: EntityDataGridProps<T>) {
    // Логування пропсів для діагностики
    console.log('🚀 EntityDataGrid рендериться з пропсами:', {
        entityType,
        title,
        enableAdd,
        enableEdit,
        enableDelete,
        height
    });

    // Стан
    const [data, setData] = useState<T[]>([]);
    const [allCategoryData, setAllCategoryData] = useState<T[]>([]); // Всі дані вибраної категорії
    const [filteredData, setFilteredData] = useState<T[]>([]); // Відфільтровані дані
    const [loading, setLoading] = useState<LoadingState>({ loading: true, error: null });
    const [pagination, setPagination] = useState({
        page: 0,
        pageSize: 25,
        total: 0
    });
    // Фільтрація для DataGrid - використовуємо вбудований механізм
    const [filterModel, setFilterModel] = useState({
        items: []
    });

    // Діалоги
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; row: T | null }>({
        open: false,
        row: null
    });
    const [searchDialog, setSearchDialog] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editDialog, setEditDialog] = useState<{ open: boolean; row: T | null }>({
        open: false,
        row: null
    });


    // Стан для фільтрування по категоріях (тільки для weapons)
    const [categories, setCategories] = useState<Array<{ id: number, ukr_name: string }>>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(entityType === 'weapons' ? 1 : null);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // ================= ФУНКЦІЇ =================

    const supportsInlineEditing = (entityType: EntityType): boolean => {
        const config = getEntityConfig(entityType);
        const result = config?.supportsInlineEditing || false;

        console.log('🔍 supportsInlineEditing перевірка:', {
            entityType,
            config: config?.name,
            supportsInlineEditing: config?.supportsInlineEditing,
            result
        });

        return result;
    };

    // Конфігурація
    const config: EntityConfig = getEntityConfig(entityType);
    console.log('🔧 Конфігурація сутності:', config);
    console.log('🔧 Тип сутності:', entityType);
    console.log('🔧 Колонки конфігурації:', config.columns);
    console.log('🔧 Підтримує inline редагування:', supportsInlineEditing(entityType));

    // Стан видимості колонок для MUI DataGrid (за замовчуванням приховані)
    const [columnVisibilityModel, setColumnVisibilityModel] = useState(() => {
        const defaultHidden = ['total_len', 'blade_len', 'weight', 'description_rus', 'epoha_name', 'guard_type_name', 'blade_type_name', 'dolls_name', 'usage_name', 'sharpening_name'];
        const visibility: Record<string, boolean> = {};

        // Всі колонки видимі за замовчуванням
        config.columns.forEach(col => {
            visibility[col.field] = !defaultHidden.includes(col.field);
        });

        return visibility;
    });



    // ================= ЗАВАНТАЖЕННЯ ДАНИХ =================

    const fetchData = useCallback(async () => {
        if (!entityType) return;

        setLoading({ loading: true, error: null });

        try {
            console.log('📊 EntityDataGrid fetching data for:', entityType);

            let result;

            // Завантажуємо ВСІ дані категорії для фільтрації (без пейджінейшну)
            if (entityType === 'weapons' && selectedCategoryId) {
                result = await apiService.getWeaponsByCategory(
                    selectedCategoryId,
                    { page: 1, limit: 10000 } // Завантажуємо всі дані
                );
            } else {
                result = await apiService.getEntityData(
                    entityType,
                    { page: 1, limit: 10000 } // Завантажуємо всі дані
                );
            }

            console.log('📊 EntityDataGrid received data:', result);
            console.log('📊 First item sample:', result.items[0]);
            const firstItem = result.items[0] as any;
            console.log('📝 Description fields in first item:', {
                description_ukr: firstItem?.description_ukr,
                description_eng: firstItem?.description_eng,
                description_rus: firstItem?.description_rus
            });

            // Трансформуємо дані для weapons, щоб додати зручні поля для відображення
            let processedItems = result.items;
            if (entityType === 'weapons') {
                processedItems = result.items.map((item: any) => ({
                    ...item,
                    category_name: (item.categories_data || item.category_data || item.category?.ukr_name)
                        ? Array.isArray(item.categories_data)
                            ? item.categories_data.map((c: any) => c.ukr_name || c.ukr || 'Невідомо').join(', ')
                            : Array.isArray(item.category_data)
                                ? item.category_data.map((c: any) => c.ukr_name || c.ukr || 'Невідомо').join(', ')
                                : item.category?.ukr_name || 'Не вказано'
                        : 'Не вказано',
                    epoha_name: item.epoha_data?.ukr || 'Не вказано',
                    guard_type_name: item.guard_type_data?.ukr || 'Не вказано',
                    blade_type_name: item.blade_type_data?.ukr || 'Не вказано',
                    dolls_name: item.dolls_data?.ukr || 'Не вказано',
                    usage_name: item.usage_data?.ukr || 'Не вказано',
                    sharpening_name: item.sharpening_data?.ukr || 'Не вказано'
                }));
            }

            setAllCategoryData(processedItems as any);
            setFilteredData(processedItems as any);
            setData(processedItems as any);
            setPagination(prev => ({
                ...prev,
                page: 0,
                total: processedItems.length,
                totalPages: Math.ceil(processedItems.length / prev.pageSize)
            }));

        } catch (error: any) {
            console.error('❌ Помилка завантаження даних:', error);
            setLoading({ loading: false, error: error.message || 'Помилка завантаження' });
        } finally {
            setLoading(prev => ({ ...prev, loading: false }));
        }
    }, [entityType, pagination.page, pagination.pageSize, selectedCategoryId]);

    // Функція для завантаження категорій (тільки для weapons)
    const fetchCategories = useCallback(async () => {
        if (entityType !== 'weapons') return;

        setCategoriesLoading(true);
        try {
            const result = await apiService.getAllCategories();
            setCategories(result.items);
        } catch (error) {
            console.error('❌ Помилка завантаження категорій:', error);
        } finally {
            setCategoriesLoading(false);
        }
    }, [entityType]);

    // Початкове завантаження
    useEffect(() => {
        fetchData();
        fetchCategories();
    }, [fetchData, fetchCategories]);

    // ================= ОБРОБНИКИ ПОДІЙ =================

    const handleRefresh = () => {
        fetchData();
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 0 }));
    };

    const handleCategoryChange = (categoryId: number | null) => {
        setSelectedCategoryId(categoryId);
        setPagination(prev => ({ ...prev, page: 0 })); // Скидаємо на першу сторінку
        setFilterModel({ items: [] }); // Скидаємо фільтри колонок
         // Скидаємо швидкий фільтр
    };




    const handleDeleteClick = (row: T) => {
        setDeleteDialog({ open: true, row });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.row) return;

        try {
            const success = await apiService.deleteEntity(entityType, deleteDialog.row.id);

            if (success) {
                setData(prev => prev.filter(row => row.id !== deleteDialog.row!.id));
                setPagination(prev => ({ ...prev, total: prev.total - 1 }));
                console.log('✅ Запис успішно видалено');
            } else {
                console.error('❌ Не вдалося видалити запис');
            }
        } catch (error: any) {
            console.error('❌ Помилка видалення:', error);
        } finally {
            setDeleteDialog({ open: false, row: null });
        }
    };

    const handleEditClick = (row: T) => {
        if (onRowEdit) onRowEdit(row);
        setEditDialog({ open: true, row });
    };

    const handleEditSave = (updatedEntity: T) => {
        // Оновлюємо дані в локальному стані
        setData(prevData =>
            prevData.map(item =>
                item.id === updatedEntity.id ? updatedEntity : item
            )
        );
        setEditDialog({ open: false, row: null });
    };

    // Функція для отримання найкращої назви (українська → англійська → російська)
    const getBestName = (row: any): string => {
        if (row.ukr_name && row.ukr_name.trim()) return row.ukr_name;
        if (row.eng_name && row.eng_name.trim()) return row.eng_name;
        if (row.rus_name && row.rus_name.trim()) return row.rus_name;
        if (row.ukr && row.ukr.trim()) return row.ukr;
        if (row.eng && row.eng.trim()) return row.eng;
        if (row.rus && row.rus.trim()) return row.rus;
        return 'Назва відсутня';
    };





    const handleSearch = async () => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSearchDialog(false);
            // Скидаємо до даних поточної категорії
            fetchData();
            return;
        }

        setLoading({ loading: true, error: null });

        try {
            // Глобальний пошук - завантажуємо ВСІ айтеми (без фільтрації по категорії)
            const result = await apiService.getEntityData(
                'weapons',
                { page: 1, limit: 10000 } // Всі айтеми
            );

            const searchLower = searchQuery.trim().toLowerCase();
            
            // Шукаємо по всіх полях, включаючи ID
            const filteredResults = result.items.filter((item: any) => {
                // Перевіряємо ID (число перетворюємо в строку)
                if (String(item.id).toLowerCase().includes(searchLower)) return true;
                
                // Перевіряємо всі інші поля
                for (const key of Object.keys(item)) {
                    const value = item[key];
                    if (value !== null && value !== undefined) {
                        const stringValue = String(value).toLowerCase();
                        if (stringValue.includes(searchLower)) {
                            return true;
                        }
                    }
                }
                return false;
            });

            // Оновлюємо дані
            setAllCategoryData(filteredResults as T[]);
            setData(filteredResults as T[]);
            setPagination(prev => ({ 
                ...prev, 
                total: filteredResults.length, 
                page: 0,
                totalPages: Math.ceil(filteredResults.length / prev.pageSize)
            }));
            setFilterModel({ items: [] }); // Скидаємо фільтри колонок
            setLoading({ loading: false, error: null });
            setSearchDialog(false);
            
            console.log(`✅ Знайдено ${filteredResults.length} результатів для "${searchQuery}"`);
        } catch (error: any) {
            console.error('Помилка пошуку:', error);
            setLoading({
                loading: false,
                error: error?.response?.data?.message || 'Помилка пошуку'
            });
        }
    };


    // ================= INLINE EDITING =================

    // Стан для нового рядка
    const [newRow, setNewRow] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Функція для отримання полів для нового рядка
    const getNewRowFields = (entityType: EntityType): string[] => {
        switch (entityType) {
            case 'categories':
                return ['ukr_name', 'eng_name', 'comments'];
            case 'weapons':
                return ['ukr_name', 'eng_name', 'rus_name', 'category_ids'];
            default:
                return ['ukr', 'eng', 'rus'];
        }
    };

    // Функція для перевірки чи можна зберегти новий ряддок
    const canSaveNewRow = (row?: any): boolean => {
        const targetRow = row || newRow;
        if (!targetRow) {
            console.log('❌ canSaveNewRow: немає даних рядка');
            return false;
        }

        // Якщо рядок в режимі редагування - дозволяємо зберегти
        if (targetRow.isEditing) {
            return true;
        }

        return false;
    };

    // Функція для створення початкового стану нового рядка
    const createInitialNewRow = async () => {
        try {
            console.log('🔄 Отримуємо максимальний ID для', entityType);
            const maxId = await apiService.getMaxId(entityType);
            console.log('✅ Отримано максимальний ID:', maxId);

            const newId = maxId + 1;
            const fields = getNewRowFields(entityType);
            const initialRow: any = {
                id: newId,
                isNew: true,
                isEditing: false
            };

            // Ініціалізуємо всі поля порожніми значеннями
            fields.forEach(field => {
                initialRow[field] = '';
            });

            console.log('➕ Створення нового рядка:', initialRow);
            setNewRow(initialRow);
            setIsCreating(false);
        } catch (error) {
            console.error('❌ Помилка отримання максимального ID:', error);
            alert('Помилка створення нового запису. Спробуйте ще раз.');
        }
    };

    // Функція для збереження нового рядка
    const handleSaveNewRow = async () => {
        if (!newRow) {
            alert('Немає даних для збереження');
            return;
        }

        // При збереженні перевіряємо наявність української назви
        const requiredField = entityType === 'categories' ? 'ukr_name' : 'ukr';
        const hasValidName = Boolean(newRow[requiredField]?.trim());

        if (!hasValidName) {
            alert('Українська назва є обов\'язковою');
            return;
        }

        try {
            setIsCreating(true);
            console.log('📤 Відправляємо дані для створення:', newRow);

            // Створюємо об'єкт з даними для створення і робимо trim() при збереженні
            const createData = Object.fromEntries(
                getNewRowFields(entityType).map(field => [field, newRow[field]?.trim() || ''])
            );

            // Використовуємо універсальний метод для створення
            const createdEntity = await apiService.createEntity(entityType, createData);
            console.log('✅ Нова сутність створена:', createdEntity);

            // Додаємо новий рядок до таблиці
            setData((prev: any[]) => [createdEntity, ...prev.filter((item: any) => !item.isNew)] as any);
            setPagination(prev => ({ ...prev, total: prev.total + 1 }));

            // Очищаємо стан
            setNewRow(null);
            setIsCreating(false);
        } catch (error: any) {
            console.error('❌ Помилка створення:', error);
            alert(`Помилка створення: ${error?.response?.data?.message || error?.message || 'Невідома помилка'}`);
            setIsCreating(false);
        }
    };

    // Функція для скасування створення
    const handleCancelNewRow = () => {
        setNewRow(null);
        setIsCreating(false);
    };


    // Функція для обробки зміни значень в клітинках
    const handleCellEditCommit = async (params: { id: number; field: string; value: any; row: any }) => {
        console.log('🔄 handleCellEditCommit викликано з параметрами:', params);
        console.log('🔍 Тип сутності:', entityType);
        console.log('✅ Підтримує inline редагування:', supportsInlineEditing(entityType));
        console.log('📊 Поточні дані:', data);

        try {
            const { id, field, value } = params;
            const isNewRow = params.row.isNew === true;

            // Якщо це новий рядок, просто оновлюємо локальний стан
            if (isNewRow) {
                console.log('📝 Оновлюємо дані нового рядка:', { field, value });
                setNewRow((prev: any) => prev ? { ...prev, [field]: value } : null);
                return;
            }

            // Для існуючих рядків використовуємо оновлення на сервері
            const updateData: any = { [field]: value };
            console.log('🚀 Відправляємо оновлення на сервер:', {
                entityType,
                id,
                updateData
            });

            const result = await apiService.updateEntity(entityType, id, updateData);

            if (result) {
                console.log(`✅ Поле ${field} успішно оновлено для ID ${id}`);
                setData(prev => prev.map(item =>
                    item.id === id ? { ...item, [field]: value } : item
                ));
            } else {
                throw new Error('Сервер не повернув оновлені дані');
            }
        } catch (error: any) {
            console.error('❌ Помилка:', error);
            console.error('📊 Деталі помилки:', {
                message: error?.message,
                response: error?.response?.data,
                status: error?.response?.status
            });

            // Показуємо помилку користувачу
            alert(`Помилка: ${error?.response?.data?.message || error?.message || 'Невідома помилка'}`);

            // Оновлюємо дані з сервера
            fetchData();
        }
    };

    // Функція для рендерингу boolean полів з кольоровими іконками
    const renderBooleanCell = (params: any) => {
        const value = params.value;
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {value ? (
                    <CheckIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} />
                ) : (
                    <CloseIcon sx={{ color: '#f44336', fontSize: '1.2rem' }} />
                )}
            </Box>
        );
    };

    // Функція для рендерингу текстового поля для нового рядка
    const renderNewRowTextField = (params: any, field: string) => {
        console.log('📝 renderNewRowTextField:', {
            field,
            value: params.value,
            rowData: params.row,
            isNewRow: params.row.isNew,
            canSave: canSaveNewRow(params.row)
        });

        return (
            <TextField
                fullWidth
                size="small"
                value={params.value || ''}
                onFocus={() => {
                    // При фокусі на будь-якому полі активуємо режим редагування
                    const updatedRow = {
                        ...params.row,
                        isEditing: true
                    };
                    setNewRow(updatedRow);
                    setData(prev => prev.map(item =>
                        item.id === updatedRow.id ? updatedRow : item
                    ));
                }}
                onChange={(e) => {
                    const newValue = e.target.value;
                    console.log(`✏️ TextField onChange:`, {
                        field,
                        oldValue: params.value,
                        newValue,
                        rowData: params.row
                    });

                    // Оновлюємо значення в новому рядку
                    const updatedRow = {
                        ...params.row,
                        [field]: newValue,
                        isEditing: true
                    };

                    // Оновлюємо стан нового рядка
                    setNewRow(updatedRow);

                    // Оновлюємо дані в таблиці
                    setData(prev => {
                        const newData = prev.map(item =>
                            item.id === updatedRow.id ? updatedRow : item
                        );
                        console.log('📊 Оновлені дані:', newData);
                        return newData;
                    });
                }}
                placeholder={`Введіть ${params.colDef.headerName.toLowerCase()}`}
                variant="standard"
                sx={{
                    '& .MuiInput-root': {
                        fontSize: '0.875rem',
                        padding: '2px 4px'
                    },
                    '& .MuiInput-input': {
                        padding: '2px'
                    }
                }}
            />
        );
    };

    // Оновлюємо функцію для додавання нового рядка
    const handleAddNewRow = () => {
        createInitialNewRow();
    };

    // Оновлюємо рендеринг кнопок для нового рядка
    const renderActionButtons = (params: any) => {
        // Спеціальна обробка для нового рядка
        if (params.row.isNew) {
            const canSave = canSaveNewRow(params.row);
            const requiredField = entityType === 'categories' ? 'ukr_name' : 'ukr';

            console.log('🔄 Рендеринг кнопок для нового рядка:', {
                canSave,
                isCreating,
                row: params.row,
                entityType,
                requiredField,
                fieldValue: params.row[requiredField]
            });

            return (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title={canSave ? "Зберегти" : "Заповніть українську назву"}>
                        <span>
                            <IconButton
                                size="small"
                                onClick={handleSaveNewRow}
                                color="success"
                                disabled={!canSave || isCreating}
                            >
                                <CheckIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Скасувати">
                        <IconButton
                            size="small"
                            onClick={handleCancelNewRow}
                            color="error"
                            disabled={isCreating}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            );
        }

        return (
            <Box>
                {enableEdit && !supportsInlineEditing(entityType) && (
                    <Tooltip title="Редагувати">
                        <IconButton
                            size="small"
                            onClick={() => handleEditClick(params.row)}
                            color="primary"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                {enableDelete && (
                    <Tooltip title="Видалити">
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(params.row)}
                            color="error"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        );
    };

    // Оновлюємо конфігурацію колонок
    const columns: GridColDef[] = [
        // Колонка з діями (перша колонка)
        ...(enableEdit || enableDelete ? [{
            field: 'actions',
            headerName: 'Дії',
            width: 72,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: renderActionButtons
        }] : []),
        // Інші колонки
        ...config.columns.map(col => {
            const isEditable = col.editable && enableEdit && supportsInlineEditing(entityType) && !col.field.startsWith('id');

            return {
                field: col.field,
                headerName: col.headerName,
                width: col.width || 150,
                editable: isEditable,
                type: col.type,
                valueGetter: col.valueGetter,
                renderCell: (params: any) => {
                    // Спеціальний рендеринг для нового рядка
                    if (params.row.isNew && getNewRowFields(entityType).includes(col.field)) {
                        return renderNewRowTextField(params, col.field);
                    }

                    return col.type === 'boolean' ? renderBooleanCell(params) : (col.renderCell ? col.renderCell(params) : params.value);
                }
            };
        })
    ];

    // Функція для перевірки чи можна редагувати клітинку
    const isCellEditable = (params: any): boolean => {
        const isNew = params.row.isNew === true;
        const field = params.field;
        const supportsInline = supportsInlineEditing(entityType);

        console.log('🔍 isCellEditable перевірка:', {
            field,
            isNew,
            supportsInline,
            row: params.row
        });

        // Для нового рядка дозволяємо редагування основних полів
        if (isNew) {
            return getNewRowFields(entityType).includes(field);
        }

        // Для існуючих рядків перевіряємо стандартні умови
        const column = columns.find(col => col.field === field);
        const columnEditable = column?.editable === true;

        return supportsInline && !isNew && columnEditable;
    };

    // ================= РЕНДЕР =================

    if (loading.error) {
        return (
            <Box p={3}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {loading.error}
                </Alert>
                <Button variant="contained" onClick={handleRefresh} startIcon={<RefreshIcon />}>
                    Спробувати знову
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Кнопки */}
            <Box sx={{ mb: 2, flexShrink: 0 }}>


                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    {/* Dropdown для фільтрування по категоріях (тільки для weapons) */}
                    {entityType === 'weapons' && (
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel id="category-filter-label">Фільтр по категорії</InputLabel>
                            <Select
                                labelId="category-filter-label"
                                value={String(selectedCategoryId || '')}
                                label="Фільтр по категорії"
                                onChange={(e) => handleCategoryChange(e.target.value === '' ? null : Number(e.target.value))}
                                disabled={categoriesLoading}
                            >
                                <MenuItem value="">
                                    <em>Всі категорії</em>
                                </MenuItem>
                                {categoriesLoading ? (
                                    <MenuItem disabled>
                                        <CircularProgress size={16} sx={{ mr: 1 }} />
                                        Завантаження...
                                    </MenuItem>
                                ) : (
                                    categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.ukr_name}
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>
                    )}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Показуємо кнопку пошуку тільки для weapons */}
                        {entityType === 'weapons' && (
                            <Button
                                variant="outlined"
                                startIcon={<SearchIcon />}
                                onClick={() => setSearchDialog(true)}
                            >
                                Пошук
                            </Button>
                        )}
                        <Button
                            variant="outlined"
                            onClick={handleRefresh}
                            disabled={loading.loading}
                        >
                            <RefreshIcon />
                        </Button>
                        {enableAdd && supportsInlineEditing(entityType) && (
                            <Button
                                variant="contained"
                                onClick={handleAddNewRow}
                                disabled={isCreating}
                                sx={{ minWidth: 40, width: 40, height: 40, p: 0 }}
                            >
                                <AddIcon />
                            </Button>
                        )}
                        {enableAdd && !supportsInlineEditing(entityType) && (
                            <Button
                                variant="contained"
                                onClick={() => setCreateDialogOpen(true)}
                                sx={{ minWidth: 40, width: 40, height: 40, p: 0 }}
                            >
                                <AddIcon />
                            </Button>
                        )}

                        {/* Форма створення */}
                        <CreateEntityForm
                            open={createDialogOpen}
                            entityType={entityType}
                            onClose={() => setCreateDialogOpen(false)}
                            onSave={(newEntity: T) => {
                                console.log('✅ Нову сутність створено:', newEntity);
                                handleRefresh();
                                setCreateDialogOpen(false);
                            }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* DataGrid */}
            <Box sx={{ flexGrow: 1, height: '95%' }}>
                <DataGrid
                    rows={newRow ? [newRow, ...allCategoryData] : allCategoryData}
                    getRowId={(row) => row.isNew ? (newRow?.id ?? -1) : row.id}
                    columns={columns.map(col => ({
                        ...col,
                        editable: getNewRowFields(entityType).includes(col.field),
                        renderCell: (params: any) => {
                            // Спеціальний рендеринг для нового рядка
                            if (params.row.isNew && getNewRowFields(entityType).includes(col.field)) {
                                return renderNewRowTextField(params, col.field);
                            }
                            return col.type === 'boolean' ? renderBooleanCell(params) : (col.renderCell ? col.renderCell(params) : params.value);
                        }
                    }))}
                    loading={loading.loading}
                    pagination
                    paginationModel={{
                        page: pagination.page,
                        pageSize: pagination.pageSize
                    }}
                    pageSizeOptions={[20, 25, 35, 50, 75, 100]}
                    rowCount={filteredData.length}
                    paginationMode="client"
                    filterMode="client"
                    sortingMode="client"
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={setColumnVisibilityModel}
                    onPaginationModelChange={(model) => {
                        if (model.page !== pagination.page) {
                            handlePageChange(model.page);
                        }
                        if (model.pageSize !== pagination.pageSize) {
                            handlePageSizeChange(model.pageSize);
                        }
                    }}
                    filterModel={filterModel}
                    onFilterModelChange={(model) => setFilterModel(model as any)}
                    onRowClick={onRowSelect ? (params: GridRowParams) => onRowSelect(params.row) : undefined}
                    processRowUpdate={async (newRow, oldRow) => {
                        console.log('🔄 processRowUpdate:', { newRow, oldRow });
                        const field = Object.keys(newRow).find(key => newRow[key] !== oldRow[key]);
                        if (!field) return oldRow;

                        const params = {
                            id: newRow.id,
                            field,
                            value: newRow[field],
                            row: newRow
                        };

                        await handleCellEditCommit(params);
                        return newRow;
                    }}
                    onCellEditStart={(params) => {
                        console.log('🔓 onCellEditStart викликано:', params);
                    }}
                    onCellEditStop={(params) => {
                        console.log('🛑 onCellEditStop викликано:', params);
                    }}
                    onCellClick={(params) => {
                        console.log('🖱️ onCellClick викликано:', params);
                    }}
                    editMode="cell"
                    isCellEditable={isCellEditable}
                    rowHeight={31}
                    slots={{
                        toolbar: GridToolbar,
                        loadingOverlay: () => (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <CircularProgress />
                            </Box>
                        )
                    }}
                    disableColumnFilter={false}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 500 }
                        }
                    }}
                    sx={{
                        '& .MuiDataGrid-cell:focus': {
                            outline: 'none'
                        },
                        '& .MuiDataGrid-cell:focus-within': {
                            outline: 'none'
                        },
                        '& .MuiDataGrid-cell--editing': {
                            backgroundColor: 'rgba(25, 118, 210, 0.08)'
                        }
                    }}
                />
            </Box>

            {/* Діалог підтвердження видалення */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, row: null })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Підтвердження видалення</DialogTitle>
                <DialogContent>
                    <Typography>
                        Ви дійсно хочете видалити цей запис? Цю операцію неможливо скасувати.
                    </Typography>
                    {deleteDialog.row && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>{getBestName(deleteDialog.row)}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                ID: {deleteDialog.row.id}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, row: null })}>
                        Скасувати
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Видалити
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Діалог пошуку */}
            {entityType === 'weapons' && (
                <Dialog
                    open={searchDialog}
                    onClose={() => setSearchDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Пошук записів</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Пошуковий запит"
                            fullWidth
                            variant="outlined"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            helperText="Мінімум 2 символи"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSearchDialog(false)}>
                            Скасувати
                        </Button>
                        <Button
                            onClick={handleSearch}
                            variant="contained"
                            disabled={searchQuery.length < 2}
                        >
                            Шукати
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Форма редагування */}
            <EditEntityForm<T>
                open={editDialog.open}
                entity={editDialog.row}
                entityType={entityType}
                onClose={() => setEditDialog({ open: false, row: null })}
                onSave={handleEditSave}
            />

        </Box>
    );
}

export default EntityDataGrid; 