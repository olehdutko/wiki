import React, { useMemo, useState } from 'react';
import {
  Box, TextField, Chip, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Stack
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';

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
  placeholder?: string;
}

const parseLinks = (raw: string): LinkItem[] => {
  if (!raw || !raw.trim() || raw.trim() === '-') return [];
  let trimmed = raw.trim();

  if (trimmed.startsWith('[') && trimmed.includes('\\"')) {
    try {
      const unescaped = trimmed.replace(/\\"/g, '"');
      const parsed = JSON.parse(unescaped) as LinkItem[];
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && item.url);
      }
    } catch (e) {
      // fallback below
    }
  }

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

  const parts: string[] = [];
  let current = '';
  let depth = 0;
  for (const ch of trimmed) {
    if (ch === '[' || ch === '{') depth++;
    if (ch === ']' || ch === '}') depth--;
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
  disabled = false,
  placeholder = 'URL'
}) => {
  const items = useMemo(() => parseLinks(value || ''), [value]);
  const [newUrl, setNewUrl] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const startAdd = () => {
    const url = newUrl.trim();
    if (!url) return;
    const updated = [...items, { url, type: 'website' as LinkItem['type'] }];
    onChange(serializeLinks(updated));
    setNewUrl('');
  };

  const startEdit = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setEditIndex(index);
    setEditUrl(items[index]?.url || '');
  };

  const saveEdit = () => {
    if (editIndex === null) return;
    const url = editUrl.trim();
    if (!url) return;
    const updated = items.map((item, i) =>
      i === editIndex ? { ...item, url } : item
    );
    onChange(serializeLinks(updated));
    setEditIndex(null);
    setEditUrl('');
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditUrl('');
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
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <TextField
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            size="small"
            placeholder={placeholder}
            fullWidth
            onKeyDown={(e) => {
              if (e.key === 'Enter') startAdd();
            }}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={startAdd}
            disabled={!newUrl.trim()}
          >
            Додати
          </Button>
        </Stack>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 180, overflowY: 'auto', p: 0.5 }}>
        {items.map((item, index) => (
          editIndex === index ? (
            <Box
              key={`edit-${index}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                flex: '1 1 100%',
                maxWidth: '100%'
              }}
            >
              <TextField
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                size="small"
                fullWidth
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
                sx={{ minWidth: 200 }}
              />
              <Tooltip title="Зберегти">
                <IconButton size="small" color="primary" onClick={saveEdit} disabled={!editUrl.trim()}>
                  <SaveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Скасувати">
                <IconButton size="small" onClick={cancelEdit}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Chip
              key={index}
              label={item.title && item.title.trim() ? item.title.trim() : item.url}
              size="small"
              onClick={(e) => handleOpen(e, item.url)}
              onDelete={disabled ? undefined : () => handleDeleteClick(index)}
              sx={{
                maxWidth: '100%',
                height: 28,
                backgroundColor: item.type === 'video' ? '#ffebee' : '#e3f2fd',
                userSelect: 'text',
                cursor: 'pointer',
                '& .MuiChip-label': {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
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
                  opacity: 0,
                  '&:hover': {
                    color: '#d32f2f',
                  },
                },
                '&:hover .MuiChip-deleteIcon': {
                  opacity: 1
                }
              }}
              icon={(
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  ml: 0.5,
                  '&:hover .edit-link-icon': {
                    opacity: 1
                  }
                }}>
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
                        className="edit-link-icon"
                        onClick={(e) => startEdit(index, e)}
                        sx={{
                          p: 0.3,
                          color: 'text.secondary',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
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
          )
        ))}
      </Box>

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