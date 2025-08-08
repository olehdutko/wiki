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
    Refresh as RefreshIcon
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
    const [searchQuery, setSearchQuery] = useState('');


        // Стан для фільтрування по категоріях (тільки для weapons)
    const [categories, setCategories] = useState<Array<{ id: number, ukr_name: string }>>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(entityType === 'weapons' ? 1 : null);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // Конфігурація
    const config: EntityConfig = getEntityConfig(entityType);

    // Стан видимості колонок для MUI DataGrid (за замовчуванням приховані)
    const [columnVisibilityModel, setColumnVisibilityModel] = useState(() => {
        const defaultHidden = ['total_len', 'blade_len', 'weight', 'description_eng', 'description_rus', 'epoha_name', 'guard_type_name', 'blade_type_name', 'dolls_name', 'usage_name', 'sharpening_name'];
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

    // ================= КОНФІГУРАЦІЯ КОЛОНОК =================

    const columns: GridColDef[] = [
        // Колонка з діями (перша колонка)
        ...(enableEdit || enableDelete ? [{
            field: 'actions',
            headerName: 'Дії',
            width: 120,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params: any) => (
                <Box>
                    {enableEdit && onRowEdit && (
                        <Tooltip title="Редагувати">
                            <IconButton
                                size="small"
                                onClick={() => onRowEdit(params.row)}
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
            )
        }] : []),
        // ВСІ колонки (видимість контролюється через columnVisibilityModel)
        ...config.columns.map(col => ({
            field: col.field,
            headerName: col.headerName,
            width: col.width || 150,
            editable: col.editable && enableEdit,
            type: col.type,
            valueGetter: col.valueGetter,
            renderCell: col.renderCell
        }))
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
        <Box sx={{ width: '100%', height }}>
            {/* Заголовок та кнопки */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h5" component="h1" gutterBottom>
                        {title || config.displayName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                            label={`Всього: ${pagination.total}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
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

                    </Box>
                </Box>

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
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={loading.loading}
                    >
                        Оновити
                    </Button>
                    {enableAdd && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {/* TODO: відкрити форму створення */ }}
                        >
                            Додати
                        </Button>
                    )}
                </Box>
            </Box>

            {/* DataGrid */}
            <DataGrid
                rows={data}
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
                slots={{
                    toolbar: GridToolbar,
                    loadingOverlay: () => (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                        </Box>
                    )
                }}
                slotProps={{
                    toolbar: {
                        showQuickFilter: false
                    }
                }}
                sx={{
                    '& .MuiDataGrid-row:hover': {
                        backgroundColor: 'action.hover'
                    }
                }}
            />

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

            
        </Box>
    );
}

export default EntityDataGrid; 