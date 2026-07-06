import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  VisibilityOutlined as ViewItemsIcon
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { ClassificationForm } from '../Forms/ClassificationForm';
import { ClassificationItemForm } from '../Forms/ClassificationItemForm';
import { apiService } from '../../services/api.service';
import type { Classification, ClassificationItem } from '../../types/api.types';

interface ClassificationsDataGridProps {
  initialClassificationId?: number | null;
  onNavigateToWeapons?: (filterLabel?: string) => void;
}

export function ClassificationsDataGrid({ initialClassificationId }: ClassificationsDataGridProps) {
  const [mode, setMode] = useState<'classifications' | 'items'>(initialClassificationId ? 'items' : 'classifications');
  const [selectedClassification, setSelectedClassification] = useState<Classification | null>(null);

  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [classificationItems, setClassificationItems] = useState<ClassificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingClassification, setEditingClassification] = useState<Classification | null>(null);
  const [editingItem, setEditingItem] = useState<ClassificationItem | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Classification | ClassificationItem | null; type: 'classification' | 'item' }>({
    open: false,
    item: null,
    type: 'classification'
  });

  const fetchClassifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getClassifications({ limit: 1000 });
      setClassifications(response.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Не вдалося завантажити класифікації');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClassificationItems = useCallback(async (classificationId: number) => {
    setLoading(true);
    try {
      const items = await apiService.getClassificationItemsByClassification(classificationId);
      setClassificationItems(items);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Не вдалося завантажити пункти класифікації');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassifications();
  }, [fetchClassifications]);

  useEffect(() => {
    if (mode === 'items' && selectedClassification) {
      fetchClassificationItems(selectedClassification.id);
    }
  }, [mode, selectedClassification, fetchClassificationItems]);

  useEffect(() => {
    if (initialClassificationId) {
      apiService.getClassificationById(initialClassificationId).then(c => {
        if (c) {
          setSelectedClassification(c);
          setMode('items');
        }
      });
    }
  }, [initialClassificationId]);

  const handleAddClassification = () => {
    setEditingClassification(null);
    setFormOpen(true);
  };

  const handleEditClassification = (classification: Classification) => {
    setEditingClassification(classification);
    setFormOpen(true);
  };

  const handleClassificationSaved = (saved: Classification) => {
    setFormOpen(false);
    setEditingClassification(null);
    fetchClassifications();
    if (selectedClassification?.id === saved.id) {
      setSelectedClassification(saved);
    }
  };

  const handleDeleteClassification = async () => {
    if (!deleteDialog.item) return;
    try {
      await apiService.deleteClassification(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null, type: 'classification' });
      fetchClassifications();
    } catch (err: any) {
      setError(err.message || 'Не вдалося видалити класифікацію');
    }
  };

  const handleViewItems = (classification: Classification) => {
    setSelectedClassification(classification);
    setMode('items');
  };

  const handleBackToClassifications = () => {
    setMode('classifications');
    setSelectedClassification(null);
    fetchClassifications();
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setItemFormOpen(true);
  };

  const handleEditItem = (item: ClassificationItem) => {
    setEditingItem(item);
    setItemFormOpen(true);
  };

  const handleItemSaved = () => {
    setItemFormOpen(false);
    setEditingItem(null);
    if (selectedClassification) {
      fetchClassificationItems(selectedClassification.id);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteDialog.item) return;
    try {
      await apiService.deleteClassificationItem(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null, type: 'classification' });
      if (selectedClassification) {
        fetchClassificationItems(selectedClassification.id);
      }
    } catch (err: any) {
      setError(err.message || 'Не вдалося видалити пункт');
    }
  };

  const classificationColumns: GridColDef<Classification>[] = [
    { field: 'id', headerName: 'ID', width: 80, type: 'number' },
    { field: 'ukr_name', headerName: 'Українська назва', flex: 1 },
    { field: 'eng_name', headerName: 'English name', flex: 1 },
    { field: 'rus_name', headerName: 'Москальська назва', flex: 1 },
    {
      field: 'actions',
      headerName: 'Дії',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Показати пункти класифікації">
            <IconButton color="primary" onClick={() => handleViewItems(params.row)}>
              <ViewItemsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Редагувати">
            <IconButton color="primary" onClick={() => handleEditClassification(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Видалити">
            <IconButton
              color="error"
              onClick={() => setDeleteDialog({ open: true, item: params.row, type: 'classification' })}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const itemColumns: GridColDef<ClassificationItem>[] = [
    { field: 'id', headerName: 'ID', width: 80, type: 'number' },
    { field: 'display_order', headerName: 'Порядок', width: 100, type: 'number' },
    { field: 'ukr_name', headerName: 'Українська назва', flex: 1 },
    { field: 'eng_name', headerName: 'English name', flex: 1 },
    { field: 'rus_name', headerName: 'Москальська назва', flex: 1 },
    {
      field: 'actions',
      headerName: 'Дії',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Редагувати">
            <IconButton color="primary" onClick={() => handleEditItem(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Видалити">
            <IconButton
              color="error"
              onClick={() => setDeleteDialog({ open: true, item: params.row, type: 'item' })}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {mode === 'items' && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToClassifications}
              color="inherit"
            >
              Назад до класифікацій
            </Button>
          )}
          <Typography variant="h6">
            {mode === 'classifications'
              ? 'Класифікації'
              : selectedClassification
                ? `Пункти класифікації: ${selectedClassification.ukr_name}`
                : 'Пункти класифікації'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              if (mode === 'classifications') fetchClassifications();
              else if (selectedClassification) fetchClassificationItems(selectedClassification.id);
            }}
            disabled={loading}
          >
            Оновити
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={mode === 'classifications' ? handleAddClassification : handleAddItem}
          >
            {mode === 'classifications' ? 'Додати класифікацію' : 'Додати пункт'}
          </Button>
        </Box>
      </Box>

      {mode === 'items' && selectedClassification && (
        <Paper sx={{ p: 2, mb: 2, textAlign: 'center' }}>
          {selectedClassification.image_path && (
            <Box sx={{ mb: 2 }}>
              <img
                src={selectedClassification.image_path}
                alt={selectedClassification.ukr_name}
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
              />
            </Box>
          )}
          {selectedClassification.description && (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
              {selectedClassification.description}
            </Typography>
          )}
          {!selectedClassification.image_path && !selectedClassification.description && (
            <Typography color="text.secondary">
              У цієї класифікації ще немає опису та зображення.
            </Typography>
          )}
        </Paper>
      )}

      <Box sx={{ flex: 1, minHeight: 500 }}>
        {mode === 'classifications' ? (
          <DataGrid
            rows={classifications}
            columns={classificationColumns}
            loading={loading}
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } }
            }}
            disableRowSelectionOnClick
          />
        ) : (
          <DataGrid
            rows={classificationItems}
            columns={itemColumns}
            loading={loading}
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } }
            }}
            disableRowSelectionOnClick
          />
        )}
      </Box>

      <ClassificationForm
        open={formOpen}
        classification={editingClassification}
        onClose={() => {
          setFormOpen(false);
          setEditingClassification(null);
        }}
        onSave={handleClassificationSaved}
      />

      {selectedClassification && (
        <ClassificationItemForm
          open={itemFormOpen}
          classificationId={selectedClassification.id}
          item={editingItem}
          onClose={() => {
            setItemFormOpen(false);
            setEditingItem(null);
          }}
          onSave={handleItemSaved}
        />
      )}

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null, type: 'classification' })}>
        <DialogTitle>
          {deleteDialog.type === 'classification' ? 'Видалити класифікацію?' : 'Видалити пункт?'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Цю дію не можна скасувати. Ви впевнені, що хочете видалити «{deleteDialog.item?.ukr_name}»?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null, type: 'classification' })} color="inherit">
            Скасувати
          </Button>
          <Button
            onClick={deleteDialog.type === 'classification' ? handleDeleteClassification : handleDeleteItem}
            color="error"
            variant="contained"
          >
            Видалити
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
