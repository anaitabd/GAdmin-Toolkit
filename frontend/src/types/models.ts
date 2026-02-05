export interface SenderAccount {
  id: number;
  email: string;
  display_name: string;
  auth_type: 'gmail' | 'smtp' | 'gmail_jwt';
  status: 'active' | 'paused' | 'suspended' | 'warming_up' | 'paused_limit_reached';
  daily_limit: number;
  daily_sent: number;
  batch_size: number;
  send_delay_ms: number;
  created_at: string;
  last_used_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  sponsor_id?: string;
  subject?: string;
  from_name?: string;
  scheduled_at?: string;
  priority?: number;
  stats: {
    total_sent: number;
    total_delivered: number;
    total_opened: number;
    total_clicked: number;
    total_bounced: number;
    total_unsubscribed: number;
    open_rate: number;
    click_rate: number;
    bounce_rate: number;
    delivery_rate: number;
  };
}

export interface CampaignEmail {
  id: number;
  campaign_id: number;
  recipient: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'bounced';
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  error_message?: string;
  sender_account_id?: number;
}

export interface CampaignTimeline {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export interface TopPerformer {
  recipient: string;
  opens: number;
  clicks: number;
  last_opened?: string;
}

export interface GSuiteDomain {
  id: number;
  domain: string;
  customer_id: string;
  admin_email: string;
  status: 'active' | 'suspended' | 'deleted';
  verified: boolean;
  max_users: number;
  created_at: string;
}

export interface GSuiteUser {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  status: 'pending' | 'creating' | 'active' | 'suspended' | 'deleted' | 'failed';
  creation_error?: string;
  created_at: string;
}

export interface QueueStatus {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}

export interface AnalyticsOverview {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  timeline: Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }>;
}
