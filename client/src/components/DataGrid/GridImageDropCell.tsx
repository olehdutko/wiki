import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { apiService } from '../../services/api.service';
import { ImagePreviewCell } from './ImagePreviewCell';

interface GridImageDropCellProps {
    itemId: number;
    imageUrl: string | null;
    previewSize?: number;
    onImageUploaded?: () => void;
}

export function GridImageDropCell({ itemId, imageUrl, previewSize = 50, onImageUploaded }: GridImageDropCellProps) {
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(imageUrl);

    // Sync with prop changes
    useEffect(() => {
        setUploadedImageUrl(imageUrl);
    }, [imageUrl]);

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback(async (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOver(false);

        const files = event.dataTransfer.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            setError('Тільки зображення');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const result = await apiService.uploadItemImages(itemId, [file]);
            if (result && result.length > 0 && result[0].url) {
                // Add cache-buster to force reload
                const urlWithCache = result[0].url + '?t=' + Date.now();
                setUploadedImageUrl(urlWithCache);
            }
            onImageUploaded?.();
        } catch (err: any) {
            setError(err.message || 'Помилка завантаження');
        } finally {
            setUploading(false);
        }
    }, [itemId, onImageUploaded]);

    // If image exists — show preview with hover popup and allow drag-and-drop replacement
    if (uploadedImageUrl) {
        return (
            <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                    border: '2px dashed',
                    borderColor: dragOver ? 'primary.main' : 'transparent',
                    bgcolor: dragOver ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    position: 'relative',
                    cursor: 'pointer'
                }}
            >
                <ImagePreviewCell imageUrl={uploadedImageUrl} previewSize={previewSize} />
                {error && (
                    <Typography
                        variant="caption"
                        color="error"
                        sx={{
                            position: 'absolute',
                            bottom: 2,
                            fontSize: '10px',
                            textAlign: 'center',
                            width: '100%'
                        }}
                    >
                        {error}
                    </Typography>
                )}
            </Box>
        );
    }

    // No image — show drop zone
    return (
        <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'grey.400',
                bgcolor: dragOver ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
            }}
        >
            {uploading ? (
                <CircularProgress size={20} />
            ) : (
                <CloudUpload
                    sx={{
                        fontSize: previewSize * 0.5,
                        color: dragOver ? 'primary.main' : 'grey.500'
                    }}
                />
            )}

            {error && (
                <Typography
                    variant="caption"
                    color="error"
                    sx={{
                        position: 'absolute',
                        bottom: 2,
                        fontSize: '10px',
                        textAlign: 'center',
                        width: '100%'
                    }}
                >
                    {error}
                </Typography>
            )}
        </Box>
    );
}
