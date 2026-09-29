
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { ExpandMore, ExpandLess, Restore } from '@mui/icons-material';
import { apiService } from '../../services/api.service';

interface AuditLog {
  id: number;
  item_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
  restored_at: string | null;
  restored_by: string | null;
}

interface ItemAuditLogTabProps {
  itemId: number;
  onRestore?: () => void;
}

const ACTION_COLORS = {
  CREATE: { label: 'Створено', color: 'success' as const },
  UPDATE: { label: 'Змінено', color: 'warning' as const },
  DELETE: { label: 'Видалено', color: 'error' as const }
};

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return isoDate;
  }
}

function tryParse(value: string | null): any {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function formatValue(value: any, maxLength: number = 120): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Так' : 'Ні';
  if (Array.isArray(value)) {
    const text = value.length === 0 ? 'пустий масив' : value.map(v => (typeof v === 'object' ? v.ukr_name || v.ukr || v.name || JSON.stringify(v) : String(v))).join(', ');
    return truncate(text, maxLength);
  }
  if (typeof value === 'object') {
    const text = JSON.stringify(value);
    return truncate(text, maxLength);
  }
  return truncate(String(value), maxLength);
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

export function ItemAuditLogTab({ itemId, onRestore }: ItemAuditLogTabProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [restoreDialog, setRestoreDialog] = useState<{ open: boolean; log: AuditLog | null }>({ open: false, log: null });
  const [restoring, setRestoring] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getItemAuditLogs(itemId);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити історію змін');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [itemId]);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openRestoreDialog = (log: AuditLog) => {
    setRestoreDialog({ open: true, log });
  };

  const closeRestoreDialog = () => {
    setRestoreDialog({ open: false, log: null });
  };

  const confirmRestore = async () => {
    const log = restoreDialog.log;
    if (!log) return;
    try {
      setRestoring(true);
      await apiService.restoreAuditLog(itemId, log.id);
      closeRestoreDialog();
      onRestore?.();
      await loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося відновити зміну');
      closeRestoreDialog();
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (logs.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Ще немає записів про зміни цього айтема.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
        Всього записів: {logs.length}
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Дата</TableCell>
              <TableCell>Дія</TableCell>
              <TableCell>Хто змінив</TableCell>
              <TableCell>Поле / Опис</TableCell>
              <TableCell>Було</TableCell>
              <TableCell>Стало</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => {
              const isExpanded = expandedRows.has(log.id);
              const oldParsed = tryParse(log.old_value);
              const newParsed = tryParse(log.new_value);
              const action = ACTION_COLORS[log.action];
              const isRestored = !!log.restored_at;

              return (
                <>
                  <TableRow
                    key={`row-${log.id}`}
                    hover
                    sx={
                      isRestored
                        ? { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                        : log.changed_by === 'Лея'
                        ? { backgroundColor: 'rgba(33, 150, 243, 0.18)' }
                        : undefined
                    }
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(log.changed_at)}</TableCell>
                    <TableCell>
                      <Chip
                        label={isRestored ? 'Відновлено' : action.label}
                        color={isRestored ? 'default' : action.color}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {log.changed_by || '—'}
                    </TableCell>
                    <TableCell>
                      {log.field_name ? (
                        <Typography variant="body2" fontWeight={500}>
                          {log.field_name}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {log.action === 'CREATE' ? 'Створення айтема' : log.action === 'DELETE' ? 'Видалення айтема' : 'Загальна зміна'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={formatValue(oldParsed, 1000)} arrow>
                        <span>{formatValue(oldParsed)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={formatValue(newParsed, 1000)} arrow>
                        <span>{formatValue(newParsed)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      {!isRestored && log.action === 'UPDATE' && log.field_name && log.field_name !== 'links' && log.field_name !== 'categories' && log.field_name !== 'territories' && (
                        <Tooltip title="Відновити цю зміну" arrow>
                          <IconButton size="small" onClick={() => openRestoreDialog(log)} sx={{ mr: 0.5 }}>
                            <Restore fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton size="small" onClick={() => toggleRow(log.id)}>
                        {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow key={`detail-${log.id}`}>
                    <TableCell colSpan={6} sx={{ p: 0, borderBottom: 'none' }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, background: '#fafafa' }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            Автор: {log.changed_by || '—'} · ID запису: {log.id}
                            {isRestored && (
                              <span> · Відновлено: {formatDate(log.restored_at!)} ({log.restored_by || '—'})</span>
                            )}
                          </Typography>
                          {log.old_value && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" fontWeight={600} color="error.main">
                                Було:
                              </Typography>
                              <Box
                                component="pre"
                                sx={{
                                  mt: 0.5,
                                  p: 1,
                                  background: '#fff',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  overflow: 'auto',
                                  maxHeight: 200
                                }}
                              >
                                {JSON.stringify(oldParsed, null, 2)}
                              </Box>
                            </Box>
                          )}
                          {log.new_value && (
                            <Box>
                              <Typography variant="caption" fontWeight={600} color="success.main">
                                Стало:
                              </Typography>
                              <Box
                                component="pre"
                                sx={{
                                  mt: 0.5,
                                  p: 1,
                                  background: '#fff',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  overflow: 'auto',
                                  maxHeight: 200
                                }}
                              >
                                {JSON.stringify(newParsed, null, 2)}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={restoreDialog.open} onClose={closeRestoreDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Підтвердження відновлення</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ви впевнені, що хочете відновити значення поля{' '}
            <strong>{restoreDialog.log?.field_name}</strong> до стану, що був до цієї зміни?
          </DialogContentText>
          <Box sx={{ mt: 2, p: 1.5, background: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Значення для відновлення:
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {formatValue(tryParse(restoreDialog.log?.old_value || null))}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRestoreDialog} disabled={restoring}>Скасувати</Button>
          <Button onClick={confirmRestore} variant="contained" color="primary" disabled={restoring}>
            {restoring ? 'Відновлення...' : 'Підтвердити'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

