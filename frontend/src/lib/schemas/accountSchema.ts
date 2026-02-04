import { z } from 'zod';

export const accountSchema = z.object({
  email: z.string().email(),
  display_name: z.string().min(1),
  auth_type: z.enum(['gmail', 'smtp', 'gmail_jwt']),
  daily_limit: z.number().min(50).max(2000),
  batch_size: z.number().min(1).max(100),
  send_delay_ms: z.number().min(100).optional(),
});

export type AccountFormData = z.infer<typeof accountSchema>;
