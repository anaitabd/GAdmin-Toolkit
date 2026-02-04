'use client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { SenderAccount } from '@/types/models';

interface EditLimitsDialogProps {
  open: boolean;
  account: SenderAccount | null;
  onClose: () => void;
  onSubmit: (id: number, limits: { daily_limit: number; batch_size: number; send_delay_ms: number }) => void;
}

interface LimitsFormData {
  daily_limit: number;
  batch_size: number;
  send_delay_ms: number;
}

export default function EditLimitsDialog({
  open,
  account,
  onClose,
  onSubmit,
}: EditLimitsDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LimitsFormData>({
    defaultValues: {
      daily_limit: account?.daily_limit || 500,
      batch_size: account?.batch_size || 50,
      send_delay_ms: account?.send_delay_ms || 1000,
    },
  });

  // Update form when account changes
  if (account && open) {
    reset({
      daily_limit: account.daily_limit,
      batch_size: account.batch_size,
      send_delay_ms: account.send_delay_ms,
    });
  }

  const onFormSubmit = (data: LimitsFormData) => {
    if (account) {
      onSubmit(account.id, data);
      onClose();
    }
  };

  if (!account) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Account Limits</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Controller
            name="daily_limit"
            control={control}
            rules={{
              required: 'Daily limit is required',
              min: { value: 50, message: 'Minimum daily limit is 50' },
              max: { value: 2000, message: 'Maximum daily limit is 2000' },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Daily Email Limit"
                type="number"
                fullWidth
                required
                error={!!errors.daily_limit}
                helperText={errors.daily_limit?.message || 'Maximum emails per day (50-2000)'}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            )}
          />
          <Controller
            name="batch_size"
            control={control}
            rules={{
              required: 'Batch size is required',
              min: { value: 1, message: 'Minimum batch size is 1' },
              max: { value: 100, message: 'Maximum batch size is 100' },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Batch Size"
                type="number"
                fullWidth
                required
                error={!!errors.batch_size}
                helperText={errors.batch_size?.message || 'Emails per batch (1-100)'}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            )}
          />
          <Controller
            name="send_delay_ms"
            control={control}
            rules={{
              required: 'Send delay is required',
              min: { value: 100, message: 'Minimum delay is 100ms' },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Send Delay (ms)"
                type="number"
                fullWidth
                required
                error={!!errors.send_delay_ms}
                helperText={
                  errors.send_delay_ms?.message ||
                  'Delay between emails in milliseconds (minimum 100)'
                }
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit(onFormSubmit)} variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
