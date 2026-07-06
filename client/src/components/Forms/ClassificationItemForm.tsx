import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { ImageUploadField } from '../Fields/ImageUploadField';
import { apiService } from '../../services/api.service';
import type { ClassificationItem, CreateClassificationItemDto, UpdateClassificationItemDto } from '../../types/api.types';

interface ClassificationItemFormProps {
  open: boolean;
  classificationId: number;
  item?: ClassificationItem | null;
  onClose: () => void;
  onSave: (item: ClassificationItem) => void;
}

const MAX_DESCRIPTION_LENGTH = 5000;

export function ClassificationItemForm({ open, classificationId, item, onClose, onSave }: ClassificationItemFormProps) {
  const isEdit = Boolean(item?.id);

  const [formData, setFormData] = useState<CreateClassificationItemDto>({
    classification_id: classificationId,
    ukr_name: '',
    eng_name: '',
    rus_name: '',
    description: '',
    image_path: '',
    display_order: 0
  });

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && item) {
      setFormData({
        classification_id: item.classification_id,
        ukr_name: item.ukr_name || '',
        eng_name: item.eng_name || '',
        rus_name: item.rus_name || '',
        description: item.description || '',
        image_path: item.image_path || '',
        display_order: item.display_order ?? 0
      });
      setTab(0);
      setError(null);
    } else if (open) {
      setFormData({
        classification_id: classificationId,
        ukr_name: '',
        eng_name: '',
        rus_name: '',
        description: '',
        image_path: '',
        display_order: 0
      });
      setTab(0);
      setError(null);
    }
  }, [open, item, classificationId]);

  const handleChange = (field: keyof CreateClassificationItemDto, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    if (!formData.ukr_name.trim()) {
      setError('Українська назва є обов\'язковою');
      setTab(0);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const payload: CreateClassificationItemDto | UpdateClassificationItemDto = {
        ...formData,
        classification_id: classificationId,
        description: formData.description || null,
        image_path: formData.image_path || null,
        display_order: Number(formData.display_order) || 0
      };

      let result: ClassificationItem;
      if (isEdit && item) {
        result = await apiService.updateClassificationItem(item.id, payload as UpdateClassificationItemDto);
      } else {
        result = await apiService.createClassificationItem(payload);
      }

      onSave(result);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Помилка збереження пункту класифікації');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_path: imageUrl }));
  };

  const handleImageDelete = () => {
    setFormData(prev => ({ ...prev, image_path: '' }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'Редагувати пункт класифікації' : 'Додати пункт класифікації'}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} sx={{ mb: 2 }}>
          <Tab label="Основна інформація" />
          <Tab label="Опис" />
          <Tab label="Зображення" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Українська назва *"
              value={formData.ukr_name}
              onChange={e => handleChange('ukr_name', e.target.value)}
              fullWidth
              inputProps={{ maxLength: 300 }}
            />
            <TextField
              label="English name"
              value={formData.eng_name}
              onChange={e => handleChange('eng_name', e.target.value)}
              fullWidth
              inputProps={{ maxLength: 300 }}
            />
            <TextField
              label="Москальська назва"
              value={formData.rus_name}
              onChange={e => handleChange('rus_name', e.target.value)}
              fullWidth
              inputProps={{ maxLength: 300 }}
            />
            <TextField
              label="Порядок відображення"
              type="number"
              value={formData.display_order}
              onChange={e => handleChange('display_order', parseInt(e.target.value, 10) || 0)}
              fullWidth
            />
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Опис (максимум {MAX_DESCRIPTION_LENGTH} символів)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={10}
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
              helperText={`${formData.description?.length || 0}/${MAX_DESCRIPTION_LENGTH}`}
            />
          </Box>
        )}

        {tab === 2 && (
          <Box>
            {!isEdit && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Збережіть пункт, щоб мати можливість додати зображення.
              </Alert>
            )}
            {isEdit && item ? (
              <ImageUploadField
                entityType="classification-items"
                entityId={item.id}
                currentImageUrl={formData.image_path}
                onImageUpload={handleImageUpload}
                onImageDelete={handleImageDelete}
              />
            ) : (
              <Typography color="text.secondary">
                Зображення буде доступне після збереження.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Скасувати
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Зберегти
        </Button>
      </DialogActions>
    </Dialog>
  );
}
