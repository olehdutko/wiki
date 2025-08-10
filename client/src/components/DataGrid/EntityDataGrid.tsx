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
    Chip,
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
    BaseEntity,
    PaginationParams,
    PaginatedResponse,
    Category
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
    const [loading, setLoading] = useState<LoadingState>({ loading: true, error: null });
    const [pagination, setPagination] = useState({
        page: 0,
        pageSize: 20,
        total: 0
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

            // Якщо це weapons і вибрана категорія, використовуємо фільтрування
            if (entityType === 'weapons' && selectedCategoryId) {
                result = await apiService.getWeaponsByCategory(
                    selectedCategoryId,
                    { page: pagination.page, limit: pagination.pageSize }
                );
            } else {
                result = await apiService.getEntityData(
                    entityType,
                    { page: pagination.page, limit: pagination.pageSize }
                );
            }

            console.log('📊 EntityDataGrid received data:', result);
            console.log('📊 First item sample:', result.items[0]);
            console.log('📝 Description fields in first item:', {
                description_ukr: result.items[0]?.description_ukr,
                description_eng: result.items[0]?.description_eng,
                description_rus: result.items[0]?.description_rus
            });

            // Трансформуємо дані для weapons, щоб додати зручні поля для відображення
            let processedItems = result.items;
            if (entityType === 'weapons') {
                processedItems = result.items.map((item: any) => ({
                    ...item,
                    category_name: item.category?.ukr_name || 'Не вказано',
                    epoha_name: item.epoha_data?.ukr || 'Не вказано',
                    guard_type_name: item.guard_type_data?.ukr || 'Не вказано',
                    blade_type_name: item.blade_type_data?.ukr || 'Не вказано',
                    dolls_name: item.dolls_data?.ukr || 'Не вказано',
                    usage_name: item.usage_data?.ukr || 'Не вказано',
                    sharpening_name: item.sharpening_data?.ukr || 'Не вказано'
                }));
            }

            setData(processedItems);
            setPagination(prev => ({
                ...prev,
                total: result.total,
                totalPages: Math.ceil(result.total / prev.pageSize)
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
            fetchData(); // Повертаємо всі дані
            return;
        }

        setLoading({ loading: true, error: null });

        try {
            const results = await apiService.search(
                config.apiEndpoint,
                searchQuery.trim()
            );

            setData(results as T[]);
            setPagination(prev => ({ ...prev, total: results.length, page: 0 }));
            setLoading({ loading: false, error: null });
            setSearchDialog(false);
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
    const [newRow, setNewRow] = useState<{ ukr: string; eng: string; rus: string } | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Функція для створення нового рядка
    const handleAddNewRow = () => {
        setNewRow({ ukr: '', eng: '', rus: '' });
        setIsCreating(true);
    };

    // Функція для збереження нового рядка
    const handleSaveNewRow = async () => {
        if (!newRow || !newRow.ukr.trim()) {
            alert('Українська назва є обов\'язковою');
            return;
        }

        try {
            setIsCreating(true);



            // Використовуємо універсальний метод для створення
            const createdEntity = await apiService.createEntity(entityType, newRow);

            // Додаємо новий рядок до таблиці
            setData(prev => [createdEntity, ...prev]);

            // Очищаємо стан
            setNewRow(null);
            setIsCreating(false);

            console.log('Нова сутність створена:', createdEntity);

        } catch (error: any) {
            console.error('Помилка створення:', error);
            alert(`Помилка створення: ${error?.response?.data?.message || 'Невідома помилка'}`);
            setIsCreating(false);
        }
    };

    // Функція для скасування створення
    const handleCancelNewRow = () => {
        setNewRow(null);
        setIsCreating(false);
    };

    // Функція для зміни значень у новому рядку
    const handleNewRowChange = (field: 'ukr' | 'eng' | 'rus', value: string) => {
        if (newRow) {
            setNewRow({ ...newRow, [field]: value });
        }
    };

    // Функція для обробки зміни значень в клітинках
    const handleCellEditCommit = async (params: any) => {
        console.log('🔄 handleCellEditCommit викликано з параметрами:', params);
        console.log('🔍 Тип сутності:', entityType);
        console.log('✅ Підтримує inline редагування:', supportsInlineEditing(entityType));
        console.log('📊 Поточні дані:', data);
        console.log('🔧 Параметри редагування:', {
            id: params.id,
            field: params.field,
            value: params.value,
            row: params.row
        });

        try {
            const { id, field, value } = params;

            console.log('🔄 handleCellEditCommit викликано:', { id, field, value });
            console.log('📊 Поточні дані:', data);
            console.log('🏷️ Тип сутності:', entityType);
            console.log('✅ Підтримує inline редагування:', supportsInlineEditing(entityType));

            // Ігноруємо новий рядок
            if (id === 'new') {
                console.log('⏭️ Ігноруємо новий рядок');
                return;
            }

            const row = data.find(item => item.id === id);

            if (!row) {
                console.warn('❌ Рядок не знайдено для ID:', id);
                return;
            }

            console.log('📝 Оновлюємо рядок:', row);
            console.log('🔍 Поле для оновлення:', field);
            console.log('🆕 Нове значення:', value);

            // Оновлюємо локальний стан
            const updatedData = data.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            );
            setData(updatedData);

            // Відправляємо зміни на сервер
            const updateData: any = { [field]: value };

            console.log('🚀 Відправляємо оновлення на сервер:', {
                entityType,
                id,
                updateData,
                endpoint: `/api/${getEntityConfig(entityType).apiEndpoint}/${id}`
            });

            // Використовуємо універсальний метод для оновлення
            const result = await apiService.updateEntity(entityType, id, updateData);

            console.log('✅ Відповідь від сервера:', result);

            if (result) {
                console.log(`✅ Поле ${field} успішно оновлено для ID ${id}`);
                console.log('🔄 Оновлюємо локальний стан з даними від сервера');

                // Оновлюємо локальний стан з даними від сервера
                const updatedData = data.map(item =>
                    item.id === id ? { ...item, ...result } : item
                );
                setData(updatedData);

                console.log('✅ Локальний стан оновлено');
            } else {
                throw new Error('Сервер не повернув оновлені дані');
            }

        } catch (error: any) {
            console.error('❌ Помилка оновлення:', error);
            console.error('📊 Деталі помилки:', {
                message: error?.message,
                response: error?.response?.data,
                status: error?.response?.status
            });

            // Відновлюємо оригінальне значення при помилці
            const originalData = data.map(item =>
                item.id === id ? { ...item, [field]: row[field] } : item
            );
            setData(originalData);

            // Показуємо помилку користувачу
            alert(`Помилка оновлення: ${error?.response?.data?.message || error?.message || 'Невідома помилка'}`);
        }
    };

    // ================= КОНФІГУРАЦІЯ КОЛОНОК =================

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

    const columns: GridColDef[] = [
        // Колонка з діями (перша колонка)
        ...(enableEdit || enableDelete ? [{
            field: 'actions',
            headerName: 'Дії',
            width: 72,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params: any) => {
                // Спеціальна обробка для нового рядка
                if (params.row.isNew) {
                    return (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Зберегти">
                                <IconButton
                                    size="small"
                                    onClick={handleSaveNewRow}
                                    color="success"
                                    disabled={isCreating}
                                >
                                    <CheckIcon fontSize="small" />
                                </IconButton>
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
            }
        }] : []),
        // ВСІ колонки (видимість контролюється через columnVisibilityModel)
        ...config.columns.map(col => {
            const isEditable = col.editable && enableEdit && supportsInlineEditing(entityType) && !col.field.startsWith('id');

            console.log('🔧 Налаштування колонки:', {
                field: col.field,
                headerName: col.headerName,
                editable: col.editable,
                enableEdit,
                supportsInline: supportsInlineEditing(entityType),
                startsWithId: col.field.startsWith('id'),
                finalEditable: isEditable,
                configColumns: config.columns,
                entityType
            });

            return {
                field: col.field,
                headerName: col.headerName,
                width: col.width || 150,
                editable: isEditable,
                type: col.type,
                valueGetter: col.valueGetter,
                renderCell: (params: any) => {
                    // Спеціальний рендеринг для нового рядка
                    if (params.row.isNew && (col.field === 'ukr' || col.field === 'eng' || col.field === 'rus')) {
                        return (
                            <TextField
                                size="small"
                                value={newRow?.[col.field as keyof typeof newRow] || ''}
                                onChange={(e) => handleNewRowChange(col.field as 'ukr' | 'eng' | 'rus', e.target.value)}
                                placeholder={`Введіть ${col.headerName.toLowerCase()}`}
                                variant="standard"
                                sx={{
                                    '& .MuiInput-root': {
                                        fontSize: '0.875rem'
                                    }
                                }}
                            />
                        );
                    }

                    // Для редагованих полів використовуємо стандартний рендеринг MUI DataGrid
                    // щоб забезпечити inline editing

                    return col.type === 'boolean' ? renderBooleanCell(params) : (col.renderCell ? col.renderCell(params) : params.value);
                }
            };
        })
    ];

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
                                value={selectedCategoryId || ''}
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
                        <Button
                            variant="outlined"
                            startIcon={<SearchIcon />}
                            onClick={() => setSearchDialog(true)}
                        >
                            Пошук
                        </Button>
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
                                startIcon={<AddIcon />}
                            >
                                Додати
                            </Button>
                        )}
                        {enableAdd && !supportsInlineEditing(entityType) && (
                            <Button
                                variant="contained"
                                onClick={() => setCreateDialogOpen(true)}
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
                    rows={newRow ? [{ id: 'new', ...newRow, isNew: true }, ...data] : data}
                    columns={columns}
                    loading={loading.loading}
                    pagination
                    paginationModel={{
                        page: pagination.page,
                        pageSize: pagination.pageSize
                    }}
                    rowCount={pagination.total}
                    paginationMode="server"
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
                    isCellEditable={(params) => {
                        const supportsInline = supportsInlineEditing(entityType);
                        const isNew = params.row.isNew;
                        const column = columns.find(col => col.field === params.field);
                        const columnEditable = column?.editable === true;

                        const isEditable = supportsInline && !isNew && columnEditable;

                        console.log('🔍 isCellEditable перевірка:', {
                            field: params.field,
                            rowId: params.row.id,
                            isNew: isNew,
                            supportsInline: supportsInline,
                            columnEditable: columnEditable,
                            column: column,
                            result: isEditable
                        });

                        return isEditable;
                    }}
                    rowHeight={31}
                    slots={{
                        toolbar: GridToolbar,
                        loadingOverlay: () => (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <CircularProgress />
                            </Box>
                        )
                    }}
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