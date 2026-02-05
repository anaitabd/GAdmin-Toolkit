'use client';
import { useEffect } from 'react';
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

  useEffect(() => {
    if (account && open) {
      reset({
        daily_limit: account.daily_limit,
        batch_size: account.batch_size,
        send_delay_ms: account.send_delay_ms,
      });
    }
  }, [account?.id, open, reset]);

  const onFormSubmit = (data: LimitsFormData) => {
    if (account) {
      onSubmit(account.id, data);
      onClose();
    }
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Account Limits</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Controller
              name="daily_limit"
              control={control}
              rules={{
                required: 'Daily limit is required',
                min: { value: 50, message: 'Minimum daily limit is 50' },
                max: { value: 2000, message: 'Maximum daily limit is 2000' },
              }}
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
              rules={{
                required: 'Batch size is required',
                min: { value: 1, message: 'Minimum batch size is 1' },
                max: { value: 100, message: 'Maximum batch size is 100' },
              }}
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
              rules={{
                required: 'Send delay is required',
                min: { value: 100, message: 'Minimum delay is 100ms' },
              }}
              render={({ field }) => (
                <>
                  <Label htmlFor="send_delay_ms">Send Delay (ms) *</Label>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onFormSubmit)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
