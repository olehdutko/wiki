/**
 * Компонент галереї зображень айтема
 * Дві таби: аплоад/прев'ю та fullscreen галерея
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    IconButton,
    Typography,
    Tabs,
    Tab,
    Grid,
    Paper,
    Radio,
    Dialog,
    DialogContent,
    Stack,
    Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import apiService from "../../services/api.service";
import type { ItemImage } from "../../services/api.service";

interface ItemImageGalleryProps {
    itemId: number;
    }

export const ItemImageGallery: React.FC<ItemImageGalleryProps> = ({ itemId }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [images, setImages] = useState<ItemImage[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
    const [scale, setScale] = useState(1);

    const loadImages = useCallback(async () => {
        const data = await apiService.getItemImages(itemId);
        setImages(data);
    }, [itemId]);

    useEffect(() => {
        loadImages();
    }, [loadImages]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const filtered = Array.from(files).filter(
            file => file.type === 'image/jpeg' || file.type === 'image/png'
        );
        if (filtered.length === 0) return;
        const newFiles = [...selectedFiles, ...filtered];
        setSelectedFiles(newFiles);
        uploadFiles(newFiles);
    };

    const uploadFiles = async (filesToUpload: File[]) => {
        if (filesToUpload.length === 0) return;

        setLoading(true);
        try {
            await apiService.uploadItemImages(itemId, filesToUpload);
            setSelectedFiles([]);
            await loadImages();
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(event.target.files);
        event.target.value = '';
    };

    const handleDelete = async (imageId: number) => {
        try {
            await apiService.deleteItemImage(itemId, imageId);
            await loadImages();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleSetPrimary = async (imageId: number) => {
        try {
            await apiService.setPrimaryItemImage(itemId, imageId);
            await loadImages();
        } catch (error) {
            console.error('Set primary failed:', error);
        }
    };

    const openFullscreen = (index: number) => {
        setFullscreenIndex(index);
        setScale(1);
    };

    const closeFullscreen = () => {
        setFullscreenIndex(null);
        setScale(1);
    };

    const navigateFullscreen = (direction: 'prev' | 'next') => {
        if (fullscreenIndex === null) return;
        if (direction === 'prev') {
            setFullscreenIndex(prev => (prev === null ? 0 : prev > 0 ? prev - 1 : images.length - 1));
        } else {
            setFullscreenIndex(prev => (prev === null ? 0 : prev < images.length - 1 ? prev + 1 : 0));
        }
        setScale(1);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (fullscreenIndex === null) return;

            if (e.key === 'ArrowLeft') {
                navigateFullscreen('prev');
            } else if (e.key === 'ArrowRight') {
                navigateFullscreen('next');
            } else if (e.key === 'Escape') {
                closeFullscreen();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fullscreenIndex, images.length]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.max(0.5, Math.min(5, prev + delta)));
    };

    const renderUploadTab = () => (
        <Box sx={{ p: 2 }}>
            <Box
                sx={{
                    border: '2px dashed #bdbdbd',
                    borderRadius: 2,
                    p: 3,
                    mb: 2,
                    textAlign: 'center',
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(25, 118, 210, 0.04)'
                    },
                    '&.drag-over': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(25, 118, 210, 0.08)'
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('drag-over');
                }}
                onDragLeave={(e) => {
                    e.currentTarget.classList.remove('drag-over');
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                    handleFiles(e.dataTransfer.files);
                }}
            >
                <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                    Перетягніть зображення сюди
                </Typography>
                <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    size="small"
                >
                    Вибрати зображення
                    <input
                        type="file"
                        accept="image/jpeg,image/png"
                        multiple
                        hidden
                        onChange={handleFileSelect}
                    />
                </Button>
            </Box>

            {selectedFiles.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Вибрано файлів: {selectedFiles.length}
                    </Typography>
                    <Stack spacing={1}>
                        {selectedFiles.map((file, idx) => (
                            <Paper key={idx} sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                    disabled={loading}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Paper>
                        ))}
                    </Stack>
                    {loading && (
                        <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                            Завантаження...
                        </Typography>
                    )}
                </Box>
            )}

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Завантажені зображення ({images.length})
            </Typography>

            {images.length === 0 ? (
                <Typography color="text.secondary">Зображень ще немає</Typography>
            ) : (
                <Grid container spacing={2}>
                    {images.map((image, index) => (
                        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={image.id}>
                            <Paper sx={{ p: 1, position: 'relative' }}>
                                <Box
                                    component="img"
                                    src={image.url}
                                    alt={`Зображення ${index + 1}`}
                                    sx={{
                                        width: '100%',
                                        height: 140,
                                        objectFit: 'cover',
                                        cursor: 'pointer',
                                        display: 'block'
                                    }}
                                    onClick={() => openFullscreen(index)}
                                />
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Tooltip title={image.is_primary ? 'Primary зображення' : 'Зробити primary'}>
                                        <Radio
                                            checked={image.is_primary}
                                            onChange={() => handleSetPrimary(image.id)}
                                            size="small"
                                        />
                                    </Tooltip>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(image.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );

    const renderGalleryTab = () => (
        <Box sx={{ p: 2, textAlign: 'center' }}>
            {images.length === 0 ? (
                <Typography color="text.secondary">Немає зображень для перегляду</Typography>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        overflowX: 'auto',
                        pb: 1,
                        justifyContent: 'center'
                    }}
                >
                    {images.map((image, index) => (
                        <Box
                            key={image.id}
                            component="img"
                            src={image.url}
                            alt={`Thumbnail ${index + 1}`}
                            onClick={() => openFullscreen(index)}
                            sx={{
                                height: 120,
                                width: 120,
                                objectFit: 'cover',
                                cursor: 'pointer',
                                border: image.is_primary ? '2px solid #1976d2' : '2px solid transparent',
                                borderRadius: 1,
                                flexShrink: 0
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );

    return (
        <Box>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Аплоад і прев'ю" />
                <Tab label="Галерея" />
            </Tabs>

            {activeTab === 0 && renderUploadTab()}
            {activeTab === 1 && renderGalleryTab()}

            <Dialog
                open={fullscreenIndex !== null}
                onClose={closeFullscreen}
                maxWidth={false}
                fullScreen
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(0, 0, 0, 0.95)',
                        color: 'white'
                    }
                }}
            >
                <DialogContent
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        p: 0
                    }}
                    onWheel={handleWheel}
                >
                    <IconButton
                        onClick={closeFullscreen}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            color: 'white',
                            zIndex: 10
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    {fullscreenIndex !== null && images[fullscreenIndex] && (
                        <Box
                            component="img"
                            src={images[fullscreenIndex].url}
                            alt="Fullscreen"
                            sx={{
                                maxWidth: '90vw',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                transform: `scale(${scale})`,
                                transition: 'transform 0.1s ease-out',
                                cursor: 'grab'
                            }}
                        />
                    )}

                    <IconButton
                        onClick={() => navigateFullscreen('prev')}
                        sx={{
                            position: 'absolute',
                            left: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'white',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            zIndex: 10,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>

                    <IconButton
                        onClick={() => navigateFullscreen('next')}
                        sx={{
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'white',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            zIndex: 10,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>

                    <Typography
                        sx={{
                            position: 'absolute',
                            bottom: 24,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            color: 'white',
                            zIndex: 10
                        }}
                    >
                        {fullscreenIndex !== null ? `${fullscreenIndex + 1} / ${images.length}` : ''}
                    </Typography>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ItemImageGallery;
