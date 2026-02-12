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
  campaign_id: number
  sent: number
  failed: number
  total_clicks: number
  unique_clickers: number
  total_opens: number
  unique_openers: number
  ctr: number
  open_rate: number
}

// ── Campaign Openers / Clickers / Links (ephemeral per-campaign) ───
export interface CampaignOpener {
  to_email: string
  opened: boolean
  opened_at: string | null
  open_count: string
  last_opened: string | null
  devices: string[] | null
  browsers: string[] | null
}

export interface CampaignClicker {
  to_email: string
  links_clicked: string
  total_clicks: string
  first_click: string | null
  last_click: string | null
  devices: string[] | null
  browsers: string[] | null
}

export interface CampaignLink {
  original_url: string
  total_sent: string
  total_clicks: string
  unique_clickers: string
  first_click: string | null
  last_click: string | null
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
  offer_id: number | null
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

// ── Tracking Links ─────────────────────────────────────────────────
export interface TrackingLink {
  id: number
  track_id: string
  original_url: string
  name: string | null
  description: string | null
  tags: string[] | null
  clicked: boolean
  clicked_at: string | null
  created_at: string
  job_id?: number | null
}

export interface TrackingLinkHtml {
  tracking_url: string
  original_url: string
  name: string | null
  html: string
  html_escaped: string
}

export interface TrackingLinkStats {
  id: number
  track_id: string
  original_url: string
  name: string | null
  description: string | null
  clicked: boolean
  clicked_at: string | null
  created_at: string
  click_count: number
  stats: {
    total_clicks: number
    unique_clickers: number
    last_clicked: string | null
    created: string
    days_active: number
    browsers: { name: string; count: number }[]
    devices: { name: string; count: number }[]
    os: { name: string; count: number }[]
    countries: { name: string; count: number }[]
  }
}

export interface ClickEvent {
  id: number
  ip_address: string | null
  user_agent: string | null
  referer: string | null
  country: string | null
  city: string | null
  device: string | null
  browser: string | null
  os: string | null
  clicked_at: string
}

export interface ClickEventsResponse {
  success: boolean
  data: ClickEvent[]
  count: number
  total: number
  limit: number
  offset: number
}

export interface TrackingLinkFilters {
  search?: string
  tag?: string
  includeJobLinks?: boolean
  limit?: number
  offset?: number
}

// ── Offers ─────────────────────────────────────────────────────────
export interface Offer {
  id: number
  name: string
  subject: string
  from_name: string
  html_content: string
  click_url: string
  unsub_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface OfferClicker {
  id: number
  offer_id: number
  campaign_id: number | null
  job_id: number | null
  to_email: string
  geo: string | null
  ip_address: string | null
  user_agent: string | null
  device: string | null
  browser: string | null
  os: string | null
  clicked_at: string
}

export interface OfferStats {
  offer_id: number
  name: string
  click_url: string
  total_clicks: number
  unique_clickers: number
  by_geo: { geo: string; clicks: number; unique_clickers: number }[]
  by_campaign: { job_id: number; clicks: number; unique_clickers: number }[]
  unsubscribes: number
}

export interface OfferClickerFilters {
  geo?: string
  campaign_id?: number
  limit?: number
  offset?: number
}

// ── Data Management ────────────────────────────────────────────────
export interface DataProvider {
  id: number
  name: string
  description: string | null
  contact_email: string | null
  contact_phone: string | null
  api_endpoint: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DataList {
  id: number
  name: string
  data_provider_id: number
  description: string | null
  vertical_id: number | null
  total_count: number | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Vertical {
  id: number
  name: string
  description: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AffiliateNetwork {
  id: number
  name: string
  description: string | null
  contact_name: string | null
  contact_email: string | null
  api_endpoint: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Blacklist {
  id: number
  name: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface BlacklistEmail {
  id: number
  blacklist_id: number
  email: string
  created_at: string
}

export interface Creative {
  id: number
  offer_id: number
  subject: string
  from_name: string
  html_content: string
  status: string
  created_at: string
  updated_at: string
}

export interface OfferLink {
  id: number
  offer_id: number
  creative_id: number | null
  type: 'click' | 'unsub'
  value: string
  status: string
  created_at: string
  updated_at: string
}

export interface FromName {
  id: number
  offer_id: number
  value: string
  status: string
  created_at: string
  updated_at: string
}

export interface Subject {
  id: number
  offer_id: number
  value: string
  status: string
  created_at: string
  updated_at: string
}

export interface SuppressionEmail {
  id: number
  offer_id: number
  email: string
  reason: string | null
  created_at: string
}

export interface SuppressionProcess {
  id: number
  affiliate_network_id: number | null
  offer_id: number | null
  data_list_ids: string | null
  status: string
  progress: number | null
  emails_found: number | null
  started_at: string
  completed_at: string | null
}

export interface Lead {
  id: number
  job_id: number | null
  campaign_id: number | null
  offer_id: number | null
  affiliate_network_id: number | null
  data_list_id: number | null
  to_email: string
  payout: string | number | null
  ip_address: string | null
  user_agent: string | null
  geo: string | null
  device: string | null
  browser: string | null
  os: string | null
  created_at: string
}

export interface AuditLog {
  id: number
  entity_type: string
  entity_id: number | null
  action: string
  changes: Record<string, unknown> | null
  user_email: string | null
  ip_address: string | null
  created_at: string
}

// ── Teams ──────────────────────────────────────────────────────────
export interface Team {
  id: number
  name: string
  status: string
  member_count?: number
  authorization_count?: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: number
  team_id: number
  user_id: number
  user_email?: string
  added_at: string
}

export interface TeamAuthorization {
  id: number
  team_id: number
  resource_type: string
  resource_id: number
  created_at: string
}

// ── Sessions ───────────────────────────────────────────────────────
export interface UserSession {
  id: number
  session_token?: string
  user_id: number
  email?: string
  given_name?: string | null
  family_name?: string | null
  ip_address: string | null
  user_agent: string | null
  last_activity: string
  created_at: string
  expires_at: string | null
}

// ── Application Logs ───────────────────────────────────────────────
export interface ApplicationLog {
  id: number
  log_type: string
  level: string
  message: string
  user_email: string | null
  context: Record<string, unknown> | null
  ip_address: string | null
  stack_trace: string | null
  created_at: string
}

// ── Auto-Responders ────────────────────────────────────────────────
export interface AutoResponder {
  id: number
  name: string
  offer_id: number
  offer_name?: string
  affiliate_network_id: number | null
  network_name?: string
  trigger_type: string
  delay_value: number | null
  delay_unit: string | null
  creative_id: number | null
  creative_name?: string
  from_name_id: number | null
  from_name?: string
  subject_id: number | null
  subject?: string
  send_limit: number | null
  status: string
  total_sent: number
  total_opened: number
  total_clicked: number
  created_at: string
  updated_at: string
}

// ── Uploaded Images ────────────────────────────────────────────────
export interface UploadedImage {
  id: number
  name: string
  filename: string
  filepath: string
  filesize: number
  mime_type: string
  url: string
  uploaded_by: string | null
  created_at: string
}

// ── Roles ──────────────────────────────────────────────────────────
export interface Role {
  id: number
  name: string
  role_type: string
  description: string | null
  status: string
  permissions: string[] | null
  user_count?: number
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: number
  user_id: number
  role_id: number
  user_email?: string
  role_name?: string
  assigned_at: string
}
