import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Snackbar
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { apiService } from '../../services/api.service';

interface AddLinkModalProps {
  open: boolean;
  onClose: () => void;
  currentItemId: number;
  currentItemName: string;
  onLinkAdded: () => void;
}

interface ItemPreview {
  id: number;
  ukr_name: string;
  eng_name: string;
  rus_name: string;
}

export const AddLinkModal: React.FC<AddLinkModalProps> = ({
  open,
  onClose,
  currentItemId,
  currentItemName,
  onLinkAdded
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [itemId, setItemId] = useState('');
  const [previewItem, setPreviewItem] = useState<ItemPreview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ItemPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce для пошуку
  useEffect(() => {
    if (activeTab !== 1 || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  // Фокус на відповідне поле при відкритті модалки
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (activeTab === 0) {
        idInputRef.current?.focus();
      } else {
        searchInputRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [open, activeTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setPreviewItem(null);
    setSearchResults([]);
    setSuccessMessage(null);

    // Встановлюємо фокус на відповідне поле після перемикання вкладки
    setTimeout(() => {
      if (newValue === 0) {
        idInputRef.current?.focus();
      } else {
        searchInputRef.current?.focus();
      }
    }, 50);
  };

  const checkItemById = async () => {
    const id = parseInt(itemId);
    if (isNaN(id)) {
      setError('Введіть коректний ID');
      return;
    }

    if (id === currentItemId) {
      setError('Не можна зв\'язати айтем з самим собою');
      return;
    }

    setLoading(true);
    setError(null);
    setPreviewItem(null);

    try {
      // Шукаємо через API
      const results = await apiService.searchItems(id.toString());
      const found = results.find(item => item.id === id);
      
      if (found) {
        setPreviewItem(found);
      } else {
        setError(`Айтем з ID ${id} не знайдено`);
      }
    } catch (err) {
      setError('Помилка при пошуку айтема');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (searchQuery.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const results = await apiService.searchItems(searchQuery);
      // Фільтруємо поточний айтем
      const filtered = results.filter(item => item.id !== currentItemId);
      setSearchResults(filtered);
    } catch (err) {
      setError('Помилка при пошуку');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async (otherItemId: number) => {
    setLoading(true);
    setError(null);

    try {
      await apiService.createLink(currentItemId, otherItemId);
      setSuccessMessage('Зв\'язок успішно додано! Можна додати ще.');
      
      // Скидаємо форму
      setItemId('');
      setPreviewItem(null);
      setSearchQuery('');
      setSearchResults([]);
      
      // Оновлюємо батьківський компонент
      onLinkAdded();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Зв\'язок вже існує');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Помилка при створенні зв\'язку');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessMessage(null);
  };

  const handleClose = () => {
    setItemId('');
    setPreviewItem(null);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    onClose();
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }} >
          <Typography variant="h6" component="div">
            Додати зв&apos;язок
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} >
            Для: <strong>{currentItemName}</strong> (ID: {currentItemId})
          </Typography>
        </DialogTitle>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
        >
          <Tab label="По ID" icon={<SearchIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Пошук за назвою" icon={<SearchIcon fontSize="small" />} iconPosition="start" />
        </Tabs>

        <DialogContent sx={{ pt: 3, minHeight: 400 }} >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)} >
              {error}
            </Alert>
          )}

          {/* Режим "По ID" */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#64748b' }} >
                Введіть ID айтема, який потрібно зв&apos;язати
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }} >
                <TextField
                  label="ID айтема"
                  type="number"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && checkItemById()}
                  fullWidth
                  size="small"
                  inputRef={idInputRef}
                />
                <Button
                  variant="outlined"
                  onClick={checkItemById}
                  disabled={loading || !itemId}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Перевірити'}
                </Button>
              </Box>

              {/* Превью знайденого айтема */}
              {previewItem && (
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#f5f5f5', 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }} >
                    Знайдено айтем:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }} >
                    <Typography variant="body1" >
                      <strong>ID:</strong> {previewItem.id}
                    </Typography>
                    <Typography variant="body1" >
                      <strong>Українська:</strong> {previewItem.ukr_name || '-'}
                    </Typography>
                    <Typography variant="body1" >
                      <strong>Англійська:</strong> {previewItem.eng_name || '-'}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddLink(previewItem.id)}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                    Додати зв&apos;язок
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Режим "Пошук" */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#64748b' }} >
                Введіть назву для пошуку (мінімум 2 символи)
              </Typography>

              <TextField
                label="Пошук за назвою"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                size="small"
                inputRef={searchInputRef}
                placeholder="Наприклад: шпага, меч, клинок..."
                sx={{ mb: 2 }}
              />

              {loading && searchQuery.length >= 2 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }} >
                  <CircularProgress size={24} />
                </Box>
              )}

              {/* Результати пошуку */}
              {searchResults.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }} >
                    Знайдено: {searchResults.length}
                  </Typography>

                  <List sx={{ 
                    maxHeight: 300, 
                    overflow: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    bgcolor: '#fafafa'
                  }} >
                    {searchResults.map((item) => (
                      <ListItem
                        key={item.id}
                        secondaryAction={
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => handleAddLink(item.id)}
                            disabled={loading}
                          >
                            Додати
                          </Button>
                        }
                        sx={{
                          borderBottom: '1px solid #f0f0f0',
                          '&:last-child': { borderBottom: 'none' }
                        }}
                      >
                        <ListItemText
                          primary={<Typography variant="body1" fontWeight={500} >
                            {item.ukr_name || item.eng_name || 'Без назви'}
                          </Typography>}
                          secondary={
                            <Box sx={{ mt: 0.5 }} >
                              <Chip 
                                label={`ID: ${item.id}`} 
                                size="small" 
                                sx={{ mr: 1, height: 20, fontSize: '0.7rem' }} 
                              />
                              {item.eng_name && (
                                <Typography component="span" variant="caption" color="text.secondary" >
                                  {item.eng_name}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {searchQuery.length >= 2 && !loading && searchResults.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }} >
                  Нічого не знайдено. Спробуйте інший запит.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }} >
          <Button onClick={handleClose} variant="outlined" >
            Закрити
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast успіху */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={handleCloseSuccess} >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
