import React from 'react';
import { TextField, Box, Typography } from '@mui/material';

interface NotesFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

export const NotesField: React.FC<NotesFieldProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  maxLength
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b', fontWeight: 500 }}>
        {label}
      </Typography>
      
      <TextField
        fullWidth
        multiline
        rows={5}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        inputProps={{ 
          maxLength,
          style: {
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#e8e8e8',
            border: '1px solid #d0d0d0',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
            minHeight: '130px',
            padding: '8px 12px',
            alignItems: 'flex-start',
            '& .MuiInputBase-input': {
              padding: 0,
              fontSize: '0.95rem',
              fontFamily: '"Segoe UI", "Roboto", sans-serif'
            },
            '&:hover': {
              borderColor: '#1976d2'
            },
            '&.Mui-focused': {
              borderColor: '#1976d2',
              borderWidth: 2
            }
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none'
          }
        }}
      />
    </Box>
  );
};
