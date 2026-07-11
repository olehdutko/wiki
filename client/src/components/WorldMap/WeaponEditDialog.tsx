import React, { useEffect, useState } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import { EditEntityForm } from '../Forms/EditEntityForm';
import { apiService } from '../../services/api.service';
import type { WeaponItemResponse } from '../../types/api.types';

interface WeaponEditDialogProps {
  itemId: number;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const WeaponEditDialog: React.FC<WeaponEditDialogProps> = ({ itemId, open, onClose, onSave }) => {
  const [weapon, setWeapon] = useState<WeaponItemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const fetchWeapon = async () => {
      try {
        setLoading(true);
        const data = await apiService.getWeaponById(itemId);
        if (data) {
          setWeapon(data);
        } else {
          setError('Айтем не знайдено');
        }
      } catch (e) {
        setError('Не вдалося завантажити айтем');
      } finally {
        setLoading(false);
      }
    };
    fetchWeapon();
  }, [itemId, open]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !weapon) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error || 'Айтем не знайдено'}</Typography>
      </Box>
    );
  }

  return (
    <EditEntityForm<WeaponItemResponse>
      open={open}
      entity={weapon}
      entityType="weapons"
      onClose={onClose}
      onSave={onSave}
    />
  );
};
