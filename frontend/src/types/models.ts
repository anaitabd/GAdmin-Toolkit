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
  status: 'active' | 'cancelled';
  created_at: string;
  stats: {
    total_sent: number;
    total_opened: number;
    total_clicked: number;
    open_rate: number;
    click_rate: number;
  };
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
