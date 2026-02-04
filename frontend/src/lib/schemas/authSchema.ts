import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Min 3 characters'),
  password: z.string().min(8, 'Min 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
