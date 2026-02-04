import { z } from 'zod';

export const gsuiteSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  customer_id: z.string().min(1, 'Customer ID is required'),
  admin_email: z.string().email('Valid email required'),
  max_users: z.number().min(1).max(10000),
});

export type GSuiteFormData = z.infer<typeof gsuiteSchema>;
