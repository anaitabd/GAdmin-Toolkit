import { z } from 'zod';

export const campaignFormSchema = z.object({
  // Step 1: Campaign Details
  name: z.string().min(1, 'Campaign name is required').max(255),
  description: z.string().optional(),
  sponsor_id: z.string().optional(),

  // Step 2: Email Content
  subject: z.string().min(1, 'Subject is required').max(255),
  from_name: z.string().min(1, 'From name is required').max(100),
  html_body: z.string().min(1, 'HTML body is required'),
  text_body: z.string().optional(),

  // Step 3: Recipients
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),

  // Step 4: Sender Selection
  sender_account_ids: z.array(z.number()).min(1, 'At least one sender account is required'),

  // Step 5: Schedule
  send_immediately: z.boolean(),
  scheduled_at: z.string().optional(),
  priority: z.number().min(1).max(10),
});

export type CampaignFormData = z.infer<typeof campaignFormSchema>;

export const recipientUploadSchema = z.object({
  emails: z.string().min(1, 'Please provide at least one email address'),
});

export type RecipientUploadData = z.infer<typeof recipientUploadSchema>;
