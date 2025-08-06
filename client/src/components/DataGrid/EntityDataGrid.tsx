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
    FormControlLabel,
    Checkbox,
    List,
    ListItem
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    ViewColumn as ViewColumnIcon
} from '@mui/icons-material';

import type {
    EntityType,
    BaseEntity,
    PaginationParams,
    PaginatedResponse
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
    const [columnVisibilityDialog, setColumnVisibilityDialog] = useState(false);

    // Стан видимості колонок (за замовчуванням приховані)
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
        new Set(['total_len', 'blade_len', 'weight'])
    );

    // Конфігурація
    const config: EntityConfig = getEntityConfig(entityType);

    // ================= ЗАВАНТАЖЕННЯ ДАНИХ =================

    const loadData = useCallback(async (params?: PaginationParams) => {
        setLoading({ loading: true, error: null });

        try {
            const paginationParams: PaginationParams = {
                page: (params?.page ?? pagination.page) + 1, // API використовує 1-based pagination
                limit: params?.limit ?? pagination.pageSize,
                sortBy: params?.sortBy ?? 'id',
                sortOrder: params?.sortOrder ?? 'DESC'
            };

            const response: PaginatedResponse<T> = await apiService.getEntityData(
                entityType,
                paginationParams
            );

            setData(response.items);
            setPagination(prev => ({
                ...prev,
                total: response.total,
                page: response.page - 1 // Конвертуємо назад в 0-based для DataGrid
            }));

            setLoading({ loading: false, error: null });
        } catch (error: any) {
            console.error('Помилка завантаження даних:', error);
            setLoading({
                loading: false,
                error: error?.response?.data?.message || 'Помилка завантаження даних'
            });
        }
    }, [entityType, pagination.page, pagination.pageSize]);

    // Початкове завантаження
    useEffect(() => {
        loadData();
    }, [loadData]);

    // ================= ОБРОБНИКИ ПОДІЙ =================

    const handleRefresh = () => {
        loadData();
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        loadData({ page: newPage });
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 0 }));
        loadData({ limit: newPageSize, page: 0 });
    };

    const handleCellEditCommit = async (params: GridCellEditCommitParams) => {
        const { id, field, value } = params;

        try {
            const updateData = { [field]: value };
            await apiService.updateEntity(entityType, id as number, updateData);

            // Оновлюємо локальні дані
            setData(prev =>
                prev.map(row =>
                    row.id === id ? { ...row, [field]: value } : row
                )
            );

            console.log('✅ Запис успішно оновлено');
        } catch (error: any) {
            console.error('❌ Помилка оновлення:', error);
            // Повертаємо старе значення
            loadData();
        }
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

    // Функція для перемикання видимості колонки
    const toggleColumnVisibility = (field: string) => {
        const newHiddenColumns = new Set(hiddenColumns);
        if (newHiddenColumns.has(field)) {
            newHiddenColumns.delete(field);
        } else {
            newHiddenColumns.add(field);
        }
        setHiddenColumns(newHiddenColumns);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSearchDialog(false);
            loadData(); // Повертаємо всі дані
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
        // Інші колонки (тільки видимі)
        ...config.columns
            .filter(col => !hiddenColumns.has(col.field))
            .map(col => ({
                field: col.field,
                headerName: col.headerName,
                width: col.width || 150,
                editable: col.editable && enableEdit,
                type: col.type,
                valueGetter: col.valueGetter
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
                    <Chip
                        label={`Всього: ${pagination.total}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
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
                        startIcon={<ViewColumnIcon />}
                        onClick={() => setColumnVisibilityDialog(true)}
                    >
                        Колонки
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
                page={pagination.page}
                pageSize={pagination.pageSize}
                rowCount={pagination.total}
                paginationMode="server"
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onCellEditCommit={handleCellEditCommit}
                onRowClick={onRowSelect ? (params: GridRowParams) => onRowSelect(params.row) : undefined}
                components={{
                    Toolbar: GridToolbar,
                    LoadingOverlay: () => (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                        </Box>
                    )
                }}
                componentsProps={{
                    toolbar: {
                        showQuickFilter: false,
                        csvExport: true
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

            {/* Діалог налаштування колонок */}
            <Dialog
                open={columnVisibilityDialog}
                onClose={() => setColumnVisibilityDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Налаштування колонок</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Оберіть які колонки відображати в таблиці:
                    </Typography>
                    <List>
                        {config.columns.map((col) => (
                            <ListItem key={col.field} sx={{ py: 0 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={!hiddenColumns.has(col.field)}
                                            onChange={() => toggleColumnVisibility(col.field)}
                                        />
                                    }
                                    label={col.headerName}
                                />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setColumnVisibilityDialog(false)}>
                        Закрити
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default EntityDataGrid; 