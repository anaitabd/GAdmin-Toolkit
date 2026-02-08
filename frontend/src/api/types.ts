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

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

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
