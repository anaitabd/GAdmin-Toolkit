export interface User {
  id: number
  email: string
  password: string | null
  given_name: string | null
  family_name: string | null
  created_at: string
}

export interface EmailData {
  id: number
  to_email: string
  geo: string | null
  list_name: string | null
  created_at: string
}

export interface EmailInfo {
  id: number
  from_name: string
  subject: string
  active: boolean
  created_at: string
}

export interface EmailTemplate {
  id: number
  name: string
  html_content: string
  active: boolean
  created_at: string
}

export interface Name {
  id: number
  given_name: string
  family_name: string
  created_at: string
}

export interface Credential {
  id: number
  name: string
  domain: string | null
  cred_json: Record<string, unknown>
  active: boolean
  created_at: string
  updated_at: string
}

export interface EmailLog {
  id: number
  user_email: string
  to_email: string
  message_index: number | null
  status: 'sent' | 'failed'
  provider: 'gmail_api' | 'smtp'
  error_message: string | null
  sent_at: string
}

export interface BounceLog {
  id: number
  email: string
  reason: string | null
  detected_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  count?: number
  limit?: number
  offset?: number
}

export interface EmailLogFilters {
  user_email?: string
  status?: string
  provider?: string
  limit?: number
  offset?: number
}

export interface BounceLogFilters {
  email?: string
  limit?: number
  offset?: number
}

export interface EmailLogStats {
  total_emails: string
  successful_emails: string
  failed_emails: string
  gmail_api_emails: string
  smtp_emails: string
}

export interface BounceLogStats {
  total_bounces: string
  unique_bounced_emails: string
}

export interface ListFilters {
  search?: string
  geo?: string
  list_name?: string
  limit?: number
  offset?: number
}

// ── Jobs ───────────────────────────────────────────────────────────
export type JobType =
  | 'send_email_api'
  | 'send_email_smtp'
  | 'send_campaign_api'
  | 'send_campaign_smtp'
  | 'generate_users'
  | 'create_google_users'
  | 'delete_google_users'
  | 'detect_bounces'

export type JobStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

export interface Job {
  id: number
  type: JobType
  status: JobStatus
  progress: number
  total_items: number
  processed_items: number
  error_message: string | null
  params: Record<string, unknown> | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

// ── Settings ───────────────────────────────────────────────────────
export interface Settings {
  admin_email: string
  default_domain: string
  default_num_records: string
  [key: string]: string
}

// ── Campaign Tracking Stats ────────────────────────────────────────
export interface CampaignTrackingStats {
  job_id: number
  sent: number
  failed: number
  total_clicks: number
  unique_clickers: number
  ctr: number
}

// ── Campaign Tracking Stats ────────────────────────────────────────
export interface CampaignTrackingStats {
  job_id: number
  sent: number
  failed: number
  total_clicks: number
  unique_clickers: number
  ctr: number
}

// ── Campaigns ──────────────────────────────────────────────────────
export interface Campaign {
  id: number
  name: string
  description: string | null
  job_id: number | null
  from_name: string
  subject: string
  html_content: string
  provider: 'gmail_api' | 'smtp'
  batch_size: number
  geo: string | null
  list_name: string | null
  recipient_offset: number | null
  recipient_limit: number | null
  user_ids: number[] | null
  scheduled_at: string | null
  created_at: string
  updated_at: string
  // Fields from JOIN with jobs
  job_status?: JobStatus
  progress?: number
  processed_items?: number
  total_items?: number
  started_at?: string | null
  completed_at?: string | null
  error_message?: string | null
}

export interface CampaignTemplate {
  id: number
  name: string
  description: string | null
  from_name: string
  subject: string
  html_content: string
  provider: 'gmail_api' | 'smtp'
  batch_size: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Unsubscribe {
  id: number
  email: string
  reason: string | null
  campaign_id: number | null
  created_at: string
}
