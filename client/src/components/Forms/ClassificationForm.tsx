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
import type { Classification, CreateClassificationDto, UpdateClassificationDto } from '../../types/api.types';

interface ClassificationFormProps {
  open: boolean;
  classification?: Classification | null;
  onClose: () => void;
  onSave: (classification: Classification) => void;
}

const MAX_DESCRIPTION_LENGTH = 5000;

export function ClassificationForm({ open, classification, onClose, onSave }: ClassificationFormProps) {
  const isEdit = Boolean(classification?.id);

  const [formData, setFormData] = useState<CreateClassificationDto>({
    ukr_name: '',
    eng_name: '',
    rus_name: '',
    description: '',
    image_path: ''
  });

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && classification) {
      setFormData({
        ukr_name: classification.ukr_name || '',
        eng_name: classification.eng_name || '',
        rus_name: classification.rus_name || '',
        description: classification.description || '',
        image_path: classification.image_path || ''
      });
      setTab(0);
      setError(null);
    } else if (open) {
      setFormData({
        ukr_name: '',
        eng_name: '',
        rus_name: '',
        description: '',
        image_path: ''
      });
      setTab(0);
      setError(null);
    }
  }, [open, classification]);

  const handleChange = (field: keyof CreateClassificationDto, value: string) => {
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
      const payload: CreateClassificationDto | UpdateClassificationDto = {
        ...formData,
        description: formData.description || null,
        image_path: formData.image_path || null
      };

      let result: Classification;
      if (isEdit && classification) {
        result = await apiService.updateClassification(classification.id, payload as UpdateClassificationDto);
      } else {
        result = await apiService.createClassification(payload);
      }

      onSave(result);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Помилка збереження класифікації');
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
        {isEdit ? 'Редагувати класифікацію' : 'Додати класифікацію'}
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
                Збережіть класифікацію, щоб мати можливість додати зображення.
              </Alert>
            )}
            {isEdit && classification ? (
              <ImageUploadField
                entityType="classifications"
                entityId={classification.id}
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
