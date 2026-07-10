import React, { useState, useMemo } from 'react';
import {
  Box, TextField, Chip, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem, Stack
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export interface LinkItem {
  url: string;
  title?: string;
  type?: 'website' | 'video' | 'article' | 'book' | 'other';
  notes?: string;
}

interface SourceLinksFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const parseLinks = (raw: string): LinkItem[] => {
  if (!raw || !raw.trim() || raw.trim() === '-') return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') && trimmed.includes('{')) {
    try {
      const parsed = JSON.parse(trimmed) as LinkItem[];
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && item.url);
      }
    } catch (e) {
      // fallback to splitting
    }
  }
  // Split by commas outside brackets (for "JSON], url" cases)
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  for (const ch of trimmed) {
    if (ch === '[') depth++;
    if (ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);

  const items: LinkItem[] = [];
  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    if (p.startsWith('[') && p.includes('{')) {
      try {
        const parsed = JSON.parse(p) as LinkItem[];
        if (Array.isArray(parsed)) {
          parsed.filter(item => item && item.url).forEach(item => items.push(item));
          continue;
        }
      } catch (e) { /* ignore */ }
    }
    // plain URL
    items.push({ url: p, type: 'website' });
  }
  return items;
};

const serializeLinks = (items: LinkItem[]): string => {
  if (items.length === 0) return '';
  const cleaned = items.map(({ url, title, type, notes }) => {
    const item: LinkItem = { url };
    if (title && title.trim()) item.title = title.trim();
    if (type) item.type = type;
    if (notes && notes.trim()) item.notes = notes.trim();
    return item;
  });
  return JSON.stringify(cleaned);
};

export const SourceLinksField: React.FC<SourceLinksFieldProps> = ({
  label,
  value,
  onChange,
  disabled = false
}) => {
  const items = useMemo(() => parseLinks(value || ''), [value]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<LinkItem>({ url: '', title: '', type: 'website', notes: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const resetForm = () => setForm({ url: '', title: '', type: 'website', notes: '' });

  const handleAddClick = () => {
    setEditIndex(null);
    resetForm();
    setAddDialogOpen(true);
  };

  const handleEditClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setEditIndex(index);
    setForm({ ...items[index] });
    setAddDialogOpen(true);
  };

  const handleSave = () => {
    const url = form.url.trim();
    if (!url) return;
    let updated = [...items];
    const newItem: LinkItem = {
      url,
      title: form.title?.trim() || undefined,
      type: form.type || 'website',
      notes: form.notes?.trim() || undefined,
    };
    if (editIndex !== null) {
      updated[editIndex] = newItem;
    } else {
      updated.push(newItem);
    }
    onChange(serializeLinks(updated));
    setAddDialogOpen(false);
    resetForm();
    setEditIndex(null);
  };

  const handleDeleteClick = (index: number) => {
    setItemToDelete(index);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete !== null) {
      const updated = items.filter((_, i) => i !== itemToDelete);
      onChange(serializeLinks(updated));
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleCopy = async (e: React.MouseEvent, item: LinkItem) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(item.url);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleOpen = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 500 }}>
        {label}
      </Typography>

      {!disabled && (
        <Button variant="outlined" size="small" onClick={handleAddClick} sx={{ mb: 2 }}>
          Додати посилання
        </Button>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {items.map((item, index) => (
          <Chip
            key={index}
            label={item.title && item.title.trim() ? item.title.trim() : item.url}
            size="small"
            onClick={(e) => handleOpen(e, item.url)}
            onDelete={disabled ? undefined : () => handleDeleteClick(index)}
            sx={{
              maxWidth: '100%',
              height: 'auto',
              backgroundColor: item.type === 'video' ? '#ffebee' : '#e3f2fd',
              userSelect: 'text',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: item.type === 'video' ? '#ffcdd2' : '#bbdefb',
              },
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                textDecoration: 'underline',
                textDecorationColor: 'transparent',
                '&:hover': {
                  textDecoration: 'underline',
                  textDecorationColor: 'primary.main',
                },
              },
              '& .MuiChip-deleteIcon': {
                color: '#ef9a9a',
                transition: 'color 0.2s ease',
                '&:hover': {
                  color: '#d32f2f',
                },
              },
            }}
            icon={(
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                <Tooltip title={copied === item.url ? 'Скопійовано!' : 'Копіювати URL'}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleCopy(e, item)}
                    sx={{
                      p: 0.3,
                      color: copied === item.url ? 'success.main' : 'text.secondary',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                {!disabled && (
                  <Tooltip title="Редагувати">
                    <IconButton
                      size="small"
                      onClick={(e) => handleEditClick(index, e)}
                      sx={{
                        p: 0.3,
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ) as unknown as React.ReactElement}
          />
        ))}
      </Box>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editIndex !== null ? 'Редагувати посилання' : 'Додати посилання'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="URL"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              fullWidth
              size="small"
              required
            />
            <TextField
              label="Назва (title)"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
              size="small"
              placeholder="Якщо пусто, покажеться URL"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Тип</InputLabel>
              <Select
                value={form.type || 'website'}
                label="Тип"
                onChange={(e) => setForm({ ...form, type: e.target.value as LinkItem['type'] })}
              >
                <MenuItem value="website">Веб-сайт</MenuItem>
                <MenuItem value="video">Відео</MenuItem>
                <MenuItem value="article">Стаття</MenuItem>
                <MenuItem value="book">Книга</MenuItem>
                <MenuItem value="other">Інше</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Примітки"
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddDialogOpen(false); resetForm(); setEditIndex(null); }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!form.url.trim()}
          >
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent>
          <Typography>Ви впевнені, що хочете видалити це посилання?</Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography sx={{ wordBreak: 'break-all' }}>
              {itemToDelete !== null ? (items[itemToDelete]?.title || items[itemToDelete]?.url) : ''}
            </Typography>
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
