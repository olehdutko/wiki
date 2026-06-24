/**
 * Компонент для завантаження зображень довідкових сутностей
 */

import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { CloudUpload, DeleteOutline } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { apiService } from '../../services/api.service';

interface ImageUploadFieldProps {
  entityType: string;
  entityId: number;
  currentImageUrl?: string | null;
  onImageUpload: (imageUrl: string) => void;
  onImageDelete: () => void;
}

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export function ImageUploadField({
  entityType,
  entityId,
  currentImageUrl,
  onImageUpload,
  onImageDelete
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Перевірка типу файлу
    if (!file.type.startsWith('image/')) {
      setError('Будь ласка, виберіть файл зображення');
      return;
    }

    // Перевірка розміру (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл занадто великий. Максимальний розмір: 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await apiService.uploadEntityImage(entityType, entityId, file);
      onImageUpload(result.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Помилка завантаження зображення');
    } finally {
      setUploading(false);
      // Очищаємо input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    try {
      await apiService.deleteEntityImage(entityType, entityId);
      onImageDelete();
    } catch (err: any) {
      setError(err.message || 'Помилка видалення зображення');
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Зображення
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {currentImageUrl ? (
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={currentImageUrl}
            alt="Entity"
            style={{
              maxWidth: '200px',
              maxHeight: '200px',
              objectFit: 'contain',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}
          />
          <IconButton
            onClick={handleDelete}
            color="error"
            size="small"
            sx={{
              position: 'absolute',
              top: -10,
              right: -10,
              bgcolor: 'white',
              boxShadow: 1,
              '&:hover': { bgcolor: '#ffebee' }
            }}
          >
            <DeleteOutline />
          </IconButton>
        </Box>
      ) : (
        <Button
          component="label"
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
          disabled={uploading}
          sx={{ textTransform: 'none' }}
        >
          {uploading ? 'Завантаження...' : 'Вибрати зображення'}
          <VisuallyHiddenInput
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
          />
        </Button>
      )}
    </Box>
  );
}
