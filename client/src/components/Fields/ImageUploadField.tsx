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
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDelete = async () => {
    try {
      await apiService.deleteEntityImage(entityType, entityId);
      onImageDelete();
    } catch (err: any) {
      setError(err.message || 'Помилка видалення зображення');
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Будь ласка, виберіть файл зображення');
      return;
    }
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
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
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          sx={{
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : 'grey.400',
            bgcolor: dragOver ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
        >
          <Button
            component="label"
            variant="outlined"
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
            disabled={uploading}
            sx={{ textTransform: 'none', mb: 1 }}
          >
            {uploading ? 'Завантаження...' : 'Вибрати зображення'}
            <VisuallyHiddenInput
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </Button>
          <Typography variant="body2" color="text.secondary">
            або перетягніть зображення сюди
          </Typography>
        </Box>
      )}
    </Box>
  );
}
