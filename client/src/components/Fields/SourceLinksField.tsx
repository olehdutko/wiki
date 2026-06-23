import React, { useState } from 'react';
import { Box, TextField, Chip, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface SourceLinksFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SourceLinksField: React.FC<SourceLinksFieldProps> = ({
  label,
  value,
  onChange,
  disabled = false
}) => {
  const [newItem, setNewItem] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const items = value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);

  const handleAdd = () => {
    if (newItem.trim()) {
      const updated = items.length > 0
        ? value + ', ' + newItem.trim()
        : newItem.trim();
      onChange(updated);
      setNewItem('');
    }
  };

  const handleDeleteClick = (item: string) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      const updated = items
        .filter(item => item !== itemToDelete)
        .join(', ');
      onChange(updated);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 500 }}>
        {label}
      </Typography>

      {/* Поле додавання - ЗВЕРХУ */}
      {!disabled && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={`Додати ${label.toLowerCase()}...`}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="outlined"
            onClick={handleAdd}
            disabled={!newItem.trim()}
          >
            Додати
          </Button>
        </Box>
      )}

      {/* Список чіпсів - ЗНИЗУ */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {items.map((item, index) => (
          <Chip
            key={index}
            label={item}
            size="small"
            onDelete={disabled ? undefined : () => handleDeleteClick(item)}
            sx={{
              maxWidth: '100%',
              height: 'auto',
              backgroundColor: '#e3f2fd',
              '&:hover': {
                backgroundColor: '#bbdefb'
              },
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                wordBreak: 'break-all'
              },
              '& .MuiChip-deleteIcon': {
                color: '#ef9a9a',
                transition: 'color 0.2s ease',
                '&:hover': {
                  color: '#d32f2f'
                }
              }
            }}
          />
        ))}
      </Box>

      {/* Діалог підтвердження видалення */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent>
          <Typography>Ви впевнені, що хочете видалити цей запис?</Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography sx={{ wordBreak: 'break-all' }}>{itemToDelete}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Скасувати</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Видалити
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
