'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountSchema, type AccountFormData } from '@/lib/schemas/accountSchema';

interface AddAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AccountFormData) => void;
}

const steps = ['Basic Information', 'Provider Credentials', 'Limits & Configuration'];

export default function AddAccountDialog({ open, onClose, onSubmit }: AddAccountDialogProps) {
  const [activeStep, setActiveStep] = useState(0);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: '',
      display_name: '',
      auth_type: 'gmail',
      daily_limit: 500,
      batch_size: 50,
      send_delay_ms: 1000,
    },
  });

  const authType = watch('auth_type');

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleClose = () => {
    setActiveStep(0);
    reset();
    onClose();
  };

  const onFormSubmit = (data: AccountFormData) => {
    onSubmit(data);
    handleClose();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
            <Controller
              name="display_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Display Name"
                  fullWidth
                  required
                  error={!!errors.display_name}
                  helperText={errors.display_name?.message}
                />
              )}
            />
            <Controller
              name="auth_type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth required>
                  <InputLabel>Provider Type</InputLabel>
                  <Select {...field} label="Provider Type">
                    <MenuItem value="gmail">Gmail</MenuItem>
                    <MenuItem value="smtp">SMTP</MenuItem>
                    <MenuItem value="gmail_jwt">Gmail JWT</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {authType === 'gmail' && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Gmail OAuth credentials are managed through the Google Cloud Console. Make sure you
                  have set up OAuth 2.0 credentials before adding this account.
                </Typography>
                <TextField
                  label="Client ID (Optional)"
                  fullWidth
                  helperText="Leave empty to use default credentials"
                />
                <TextField
                  label="Client Secret (Optional)"
                  fullWidth
                  type="password"
                  helperText="Leave empty to use default credentials"
                />
                <TextField
                  label="Refresh Token (Optional)"
                  fullWidth
                  type="password"
                  helperText="Will be generated through OAuth flow"
                />
              </>
            )}
            {authType === 'gmail_jwt' && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Gmail JWT authentication requires a service account with domain-wide delegation.
                  Upload your service account JSON key file.
                </Typography>
                <Button variant="outlined" component="label">
                  Upload Service Account Key
                  <input type="file" accept=".json" hidden />
                </Button>
                <TextField
                  label="Subject Email"
                  fullWidth
                  helperText="Email address to impersonate"
                />
              </>
            )}
            {authType === 'smtp' && (
              <>
                <TextField label="SMTP Host" fullWidth required />
                <TextField label="SMTP Port" type="number" fullWidth required />
                <TextField label="SMTP Username" fullWidth required />
                <TextField label="SMTP Password" type="password" fullWidth required />
                <FormControl fullWidth>
                  <InputLabel>Use TLS</InputLabel>
                  <Select defaultValue="true" label="Use TLS">
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="daily_limit"
              control={control}
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
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Send Delay (ms)"
                  type="number"
                  fullWidth
                  error={!!errors.send_delay_ms}
                  helperText={
                    errors.send_delay_ms?.message ||
                    'Delay between emails in milliseconds (minimum 100)'
                  }
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              )}
            />
            <Typography variant="caption" color="text.secondary">
              New accounts automatically start in "Warming Up" mode with gradual limit increases to
              maintain sender reputation.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Sender Account</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent(activeStep)}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} variant="outlined">
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained">
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit(onFormSubmit)} variant="contained">
            Create Account
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
