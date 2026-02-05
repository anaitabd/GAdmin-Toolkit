'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountSchema, type AccountFormData } from '@/lib/schemas/accountSchema';
import { cn } from '@/lib/utils';

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
          <div className="space-y-4">
            <div className="space-y-2">
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="space-y-2">
              <Controller
                name="display_name"
                control={control}
                render={({ field }) => (
                  <>
                    <Label htmlFor="display_name">Display Name *</Label>
                    <Input
                      {...field}
                      id="display_name"
                      placeholder="John Doe"
                      className={errors.display_name ? 'border-red-500' : ''}
                    />
                    {errors.display_name && (
                      <p className="text-sm text-red-500">{errors.display_name.message}</p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="space-y-2">
              <Controller
                name="auth_type"
                control={control}
                render={({ field }) => (
                  <>
                    <Label>Provider Type *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gmail">Gmail</SelectItem>
                        <SelectItem value="smtp">SMTP</SelectItem>
                        <SelectItem value="gmail_jwt">Gmail JWT</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            {authType === 'gmail' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Gmail OAuth credentials are managed through the Google Cloud Console. Make sure you
                  have set up OAuth 2.0 credentials before adding this account.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID (Optional)</Label>
                  <Input
                    id="client_id"
                    placeholder="Leave empty to use default credentials"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_secret">Client Secret (Optional)</Label>
                  <Input
                    id="client_secret"
                    type="password"
                    placeholder="Leave empty to use default credentials"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refresh_token">Refresh Token (Optional)</Label>
                  <Input
                    id="refresh_token"
                    type="password"
                    placeholder="Will be generated through OAuth flow"
                  />
                </div>
              </>
            )}
            {authType === 'gmail_jwt' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Gmail JWT authentication requires a service account with domain-wide delegation.
                  Upload your service account JSON key file.
                </p>
                <Button variant="outline">
                  Upload Service Account Key
                  <input type="file" accept=".json" className="hidden" />
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="subject_email">Subject Email</Label>
                  <Input
                    id="subject_email"
                    placeholder="Email address to impersonate"
                  />
                </div>
              </>
            )}
            {authType === 'smtp' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host *</Label>
                  <Input id="smtp_host" placeholder="smtp.example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port *</Label>
                  <Input id="smtp_port" type="number" placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">SMTP Username *</Label>
                  <Input id="smtp_username" placeholder="username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">SMTP Password *</Label>
                  <Input id="smtp_password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Use TLS</Label>
                  <Select defaultValue="true">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Controller
                name="daily_limit"
                control={control}
                render={({ field }) => (
                  <>
                    <Label htmlFor="daily_limit">Daily Email Limit *</Label>
                    <Input
                      {...field}
                      id="daily_limit"
                      type="number"
                      className={errors.daily_limit ? 'border-red-500' : ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                    {errors.daily_limit ? (
                      <p className="text-sm text-red-500">{errors.daily_limit.message}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Maximum emails per day (50-2000)</p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="space-y-2">
              <Controller
                name="batch_size"
                control={control}
                render={({ field }) => (
                  <>
                    <Label htmlFor="batch_size">Batch Size *</Label>
                    <Input
                      {...field}
                      id="batch_size"
                      type="number"
                      className={errors.batch_size ? 'border-red-500' : ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                    {errors.batch_size ? (
                      <p className="text-sm text-red-500">{errors.batch_size.message}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Emails per batch (1-100)</p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="space-y-2">
              <Controller
                name="send_delay_ms"
                control={control}
                render={({ field }) => (
                  <>
                    <Label htmlFor="send_delay_ms">Send Delay (ms)</Label>
                    <Input
                      {...field}
                      id="send_delay_ms"
                      type="number"
                      className={errors.send_delay_ms ? 'border-red-500' : ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                    {errors.send_delay_ms ? (
                      <p className="text-sm text-red-500">{errors.send_delay_ms.message}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Delay between emails in milliseconds (minimum 100)
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              New accounts automatically start in "Warming Up" mode with gradual limit increases to
              maintain sender reputation.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Sender Account</DialogTitle>
        </DialogHeader>
        
        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    index <= activeStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index + 1}
                </div>
                <p className="text-xs mt-1 text-center">{label}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2',
                    index < activeStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="py-4">{renderStepContent(activeStep)}</div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit(onFormSubmit)}>Create Account</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
