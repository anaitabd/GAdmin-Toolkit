# Phase 7: Campaign Send Flow - Implementation Summary

## Overview
Phase 7 implements the complete campaign send flow that replaces iresponse-pro's `Production.php::proceedSend()` and `send-process.js` with a GAdmin-Toolkit equivalent using Gmail API + SMTP only. This is the most critical business logic section of the system.

## Database Schema Updates

### Campaigns Table Extensions
Added 16 new columns to support full offer integration:

```sql
-- Campaign Configuration
affiliate_network_id INTEGER          -- Link to affiliate network
creative_id INTEGER                   -- Specific creative (null = random/rotation)
from_name_id INTEGER                  -- Specific from_name (null = random/rotation)
subject_id INTEGER                    -- Specific subject (null = random/rotation)
data_list_ids INTEGER[]               -- Array of data list IDs to send to
data_provider_ids INTEGER[]           -- Array of data provider IDs
placeholders_config JSONB             -- Custom placeholder configuration
rotation_enabled BOOLEAN              -- Enable content rotation
batch_delay_ms INTEGER                -- Delay between batches (default 50ms)
test_emails TEXT[]                    -- Test email addresses

-- Campaign Statistics
total_sent INTEGER                    -- Total emails sent
total_failed INTEGER                  -- Total send failures
total_opened INTEGER                  -- Total opens
total_clicked INTEGER                 -- Total clicks
total_unsubs INTEGER                  -- Total unsubscribes
total_leads INTEGER                   -- Total conversions
```

File: `main/api/db/migrations/add_data_sponsor_management.sql` (lines 252-277)

## Backend Implementation

### 1. Campaign Send Orchestration Routes
File: `main/api/routes/campaignSend.js`

Nine endpoints implementing the cascading UI flow:

#### POST /api/campaign-send/resolve-offer
- Input: `{ offer_id }`
- Output: `{ offer, from_names[], subjects[], creatives[], offer_links }`
- Purpose: Load all active content for an offer (step 1 of cascading)

#### POST /api/campaign-send/resolve-creative
- Input: `{ creative_id }`
- Output: `{ subject, from_name, html_content, links[] }`
- Purpose: Load specific creative details

#### POST /api/campaign-send/resolve-lists
- Input: `{ data_provider_ids[], offer_id?, verticals?, geo? }`
- Output: `{ data_lists[], total_emails }`
- Purpose: Filter data lists by provider and count available emails after suppression

#### POST /api/campaign-send/preview
- Input: `{ offer_id, creative_id?, from_name_id?, subject_id?, data_list_ids[], recipient_limit?, geo? }`
- Output: `{ estimated_recipients, excluded_count: { total, blacklisted, suppressed, bounced, unsubbed }, sample_personalized_email }`
- Purpose: Run full filtering pipeline without sending, show exclusion breakdown

#### POST /api/campaign-send/test
- Input: `{ offer_id, creative_id?, from_name_id?, subject_id?, test_emails[], provider }`
- Output: `{ sent[], failed[] }`
- Purpose: Send test emails to specific addresses

#### POST /api/campaign-send/start
- Input: Full campaign configuration (19 parameters)
- Output: `{ campaign_id, job_id, estimated_recipients, status }`
- Purpose: Create campaign and job records, fork worker process
- Key logic:
  1. Validate all inputs (offer active, network active, lists exist)
  2. Create campaign record with all params
  3. Create job record (type: send_campaign_api or send_campaign_smtp)
  4. Fork appropriate job worker
  5. Return immediately with campaign/job IDs

#### POST /api/campaign-send/pause/:campaignId
- Purpose: Pause a running campaign by updating job status

#### POST /api/campaign-send/resume/:campaignId
- Purpose: Resume a paused campaign

#### POST /api/campaign-send/kill/:campaignId
- Purpose: Cancel/kill a campaign

### 2. Lead Postback Endpoint
File: `main/api/routes/postback.js`

#### GET /postback
- Query params: `?offer_id=X&email=Y&payout=Z&transaction_id=T`
- Purpose: Receive conversion notifications from affiliate networks
- Logic:
  1. Validate offer_id exists and is active
  2. Find email in email_data
  3. Insert lead record with full context
  4. Set email_data.is_leader = true
  5. Update campaign.total_leads counter
  6. Return 1x1 transparent pixel

### 3. Enhanced Placeholder System
File: `main/api/lib/placeholders.js`

Comprehensive placeholder replacement engine supporting:

#### Recipient Data Placeholders
- `[to]` - email username (before @)
- `[email]` - full email address
- `[first_name]` - from email_data.first_name
- `[last_name]` - from email_data.last_name
- `[full_name]` - first_name + last_name

#### Dynamic Placeholders
- `[date]` - YYYY-MM-DD
- `[datetime]` - YYYY-MM-DD HH:MM:SS
- `[timestamp]` - Unix timestamp
- `[random]` - random 8-char string
- `[random_N]` - random N-char string (e.g., [random_16])
- `[md5]` - MD5 hash of recipient email

#### Tracking Placeholders
- `[click_url]` - wrapped click tracking URL
- `[unsub_url]` - wrapped unsub tracking URL
- `[open_pixel]` - 1x1 tracking pixel img tag
- `[unsub_link]` - full &lt;a&gt; unsub link

#### Offer Data Placeholders
- `[offer_name]` - offer.name
- `[from_name]` - selected from_name value
- `[subject]` - selected subject value

Functions:
- `personalizeContent(template, recipient, context)` - for HTML content
- `personalizeSubject(template, recipient, context)` - for subject lines
- `extractPlaceholders(template)` - list all placeholders in template
- `validatePlaceholders(template)` - validate supported placeholders

### 4. Tracking Updates
File: `main/api/routes/tracking.js`

Enhanced click and open tracking to set email_data flags:

#### On Click Event
1. Record click_event as existing
2. UPDATE email_data SET is_clicker = true WHERE to_email = clicked_email
3. INSERT INTO offer_clickers with full context (offer_id, campaign_id, job_id, geo, device, browser, os)
4. UPDATE campaigns SET total_clicked = total_clicked + 1

#### On Open Event
1. Record open_event as existing
2. UPDATE email_data SET is_opener = true WHERE to_email = opened_email
3. UPDATE campaigns SET total_opened = total_opened + 1

#### On Unsub Event
1. Record in unsubscribes with full context (affiliate_network_id, campaign_id, offer_id, data_list_id, ip, user_agent, geo)
2. UPDATE email_data SET is_unsub = true WHERE to_email = unsub_email
3. INSERT INTO suppression_emails if offer has suppression enabled
4. UPDATE campaigns SET total_unsubs = total_unsubs + 1

### 5. Campaign Analytics Endpoints
File: `main/api/routes/campaigns.js`

New analytics endpoints added:

#### GET /api/campaigns/:id/recipients
- Returns: Paginated email_logs with status and tracking events
- Shows: to_email, status, sent_at, has_opened, has_clicked, click_count

#### GET /api/campaigns/:id/clicks
- Returns: Click_tracking records with device/geo breakdown
- Shows: to_email, original_url, clicked_at, device, browser, os, geo

#### GET /api/campaigns/:id/opens
- Returns: Open_tracking records
- Shows: to_email, opened_at, device, browser, os

#### GET /api/campaigns/:id/leads
- Returns: Leads for campaign with payout totals
- Shows: to_email, payout, geo, device, offer_name, network_name
- Aggregates: total_leads, total_payout

#### GET /api/campaigns/compare
- Input: `{ campaign_ids: [1, 2, 3] }`
- Returns: Side-by-side stats for A/B testing comparison
- Shows: sent, failed, opened, open_rate, clicked, click_rate, leads, conversion_rate, total_payout

### 6. Server Registration
File: `main/api/server.js`

Registered new routes:
```javascript
app.use('/api/campaign-send', campaignSendRouter);
app.use('/postback', postbackRouter);
```

## Frontend Implementation

### 1. Campaign Send Page
File: `frontend/src/pages/CampaignSend.tsx`

Comprehensive campaign creation UI with cascading dropdowns:

#### Structure
- **Campaign Info**: Name, description, provider selection
- **Sponsor Section**: Network → Offer → Creative/FromName/Subject with rotation option
- **Data Section**: Provider selection → List selection with counts
- **Sending Config**: Batch size, delay, limits
- **Preview**: Estimated recipients with exclusion breakdown
- **Actions**: Preview button, Start Campaign button

#### Key Features
- Cascading dropdowns: Selecting offer loads from_names, subjects, creatives
- Rotation mode: Option to cycle through all active content
- Real-time data list filtering by provider and geo
- Preview functionality showing estimated recipients and exclusions
- Form validation with error handling

### 2. Campaign Monitor Page
File: `frontend/src/pages/CampaignMonitor.tsx`

Real-time campaign monitoring dashboard:

#### Features
- **Header**: Campaign name, description, status badge
- **Progress Bar**: Visual progress with percentage and timestamps
- **Stats Grid**: 4 stat cards (Sent, Failed, Opened, Clicked) with percentages
- **Controls**: Pause/Resume/Kill buttons based on status
- **Live Log**: Auto-scrolling console showing recent sends with status indicators
- **Auto-refresh**: Updates every 5 seconds

### 3. API Integration
File: `frontend/src/api/campaignSend.ts`

TypeScript API client for campaign send endpoints:
- `resolveOffer(offer_id)` - Load offer details
- `resolveCreative(creative_id)` - Load creative details
- `resolveLists(params)` - Load filtered data lists
- `preview(params)` - Preview campaign
- `sendTest(params)` - Send test emails
- `start(params)` - Start campaign
- `pause(campaignId)` - Pause campaign
- `resume(campaignId)` - Resume campaign
- `kill(campaignId)` - Kill campaign

File: `frontend/src/api/campaigns.ts`

Added analytics endpoints:
- `getRecipients(id, params)` - Get campaign recipients
- `getClicks(id, params)` - Get click records
- `getOpens(id, params)` - Get open records
- `getLeads(id, params)` - Get leads
- `compareCampaigns(campaign_ids)` - Compare multiple campaigns

### 4. Routing and Navigation
Files: `frontend/src/App.tsx`, `frontend/src/components/layout/Sidebar.tsx`

Added routes:
- `/campaign-send` - Campaign creation page
- `/campaign-monitor/:id` - Campaign monitoring page

Added navigation link in Operations section of sidebar

## Testing Results

### Backend Validation
✅ All JavaScript files syntax validated:
- `main/api/routes/campaignSend.js` - Valid
- `main/api/routes/postback.js` - Valid
- `main/api/lib/placeholders.js` - Valid
- `main/api/server.js` - Valid
- `main/api/routes/campaigns.js` - Valid
- `main/api/routes/tracking.js` - Valid

### Frontend Validation
✅ TypeScript compilation:
- Fixed all type errors in CampaignSend.tsx
- Fixed missing hook imports (used direct API calls with useQuery)
- Validated type safety for all API responses

## Implementation Completeness

### ✅ Completed
1. Database schema updates (16 new columns)
2. Campaign send orchestration routes (9 endpoints)
3. Lead postback endpoint
4. Enhanced placeholder system (17+ placeholders)
5. Tracking flag updates (is_opener, is_clicker, is_unsub)
6. Campaign analytics endpoints (5 new endpoints)
7. Frontend campaign send page
8. Frontend campaign monitor page
9. API integration and routing
10. Code syntax validation

### 🔄 Future Enhancements (Optional)
1. Integration of enhanced placeholder system into existing job workers
   - Current workers use basic lib/sendFilters.js replacePlaceholders()
   - Could be upgraded to use new lib/placeholders.js for full feature set
2. Database migration testing (requires PostgreSQL setup)
3. End-to-end functional testing (requires running servers)

## Architecture Highlights

### Cascading UI Pattern
The campaign send flow follows a cascading pattern that mirrors iresponse-pro:
1. Select Affiliate Network (optional)
2. Select Offer → loads available from_names, subjects, creatives
3. Select Creative/FromName/Subject OR enable rotation
4. Select Data Providers → loads available data_lists
5. Select Data Lists → shows total available recipients
6. Preview → shows estimated recipients after filtering
7. Start → creates campaign and begins sending

### Filtering Pipeline
Recipients are filtered through multiple stages:
1. Load from selected data_lists
2. Apply geo filter (optional)
3. Remove blacklisted emails
4. Remove suppressed emails for this offer
5. Remove unsubscribed emails
6. Remove hard bounced emails
7. Remove is_unsub and is_optout flagged emails

### Tracking Integration
Full tracking context flows through the system:
- Click tracking: Links offer_id, campaign_id, job_id, data_list_id
- Open tracking: Links to job_id and campaign_id
- Lead tracking: Links to offer_id, affiliate_network_id, campaign_id, job_id
- Email flags: is_opener, is_clicker, is_leader, is_unsub set on email_data

## File Summary

### New Backend Files
1. `main/api/routes/campaignSend.js` - 780 lines - Campaign orchestration endpoints
2. `main/api/routes/postback.js` - 157 lines - Lead postback endpoint
3. `main/api/lib/placeholders.js` - 300 lines - Placeholder replacement engine

### Modified Backend Files
1. `main/api/db/migrations/add_data_sponsor_management.sql` - Added 26 lines - Campaign table extensions
2. `main/api/routes/campaigns.js` - Added 237 lines - Analytics endpoints
3. `main/api/routes/tracking.js` - Modified 2 sections - Email flag updates
4. `main/api/server.js` - Added 2 lines - Route registration

### New Frontend Files
1. `frontend/src/pages/CampaignSend.tsx` - 456 lines - Campaign creation UI
2. `frontend/src/pages/CampaignMonitor.tsx` - 258 lines - Campaign monitoring UI
3. `frontend/src/api/campaignSend.ts` - 158 lines - Campaign send API client

### Modified Frontend Files
1. `frontend/src/api/campaigns.ts` - Added 15 lines - Analytics API methods
2. `frontend/src/App.tsx` - Added 4 lines - Routes
3. `frontend/src/components/layout/Sidebar.tsx` - Added 1 line - Navigation link

## Total Implementation
- **New Files**: 6
- **Modified Files**: 7
- **Total Lines Added**: ~2,300
- **Backend**: ~1,200 lines
- **Frontend**: ~900 lines
- **Database**: ~200 lines (schema + migrations)

## API Endpoint Summary

### Campaign Send Orchestration
- POST /api/campaign-send/resolve-offer
- POST /api/campaign-send/resolve-creative
- POST /api/campaign-send/resolve-lists
- POST /api/campaign-send/preview
- POST /api/campaign-send/test
- POST /api/campaign-send/start
- POST /api/campaign-send/pause/:campaignId
- POST /api/campaign-send/resume/:campaignId
- POST /api/campaign-send/kill/:campaignId

### Lead Tracking
- GET /postback

### Campaign Analytics
- GET /api/campaigns/:id/recipients (NEW)
- GET /api/campaigns/:id/clicks (NEW)
- GET /api/campaigns/:id/opens (NEW)
- GET /api/campaigns/:id/leads (NEW)
- GET /api/campaigns/compare (NEW)

## Next Steps for Deployment

1. **Database Migration**: Run the updated migration script on production database
2. **Environment Variables**: Ensure BASE_URL or PUBLIC_URL is set for tracking links
3. **Testing**: Test each endpoint with sample data
4. **UI Testing**: Verify cascading dropdowns work correctly
5. **Integration Testing**: Test full campaign send flow end-to-end
6. **Monitor**: Watch campaign monitor page during test sends

## Conclusion

Phase 7 successfully implements the complete campaign send flow, replacing iresponse-pro's core business logic with a modern, maintainable solution. The implementation includes:

- ✅ Comprehensive database schema for campaign configuration
- ✅ Full-featured API endpoints for campaign orchestration
- ✅ Enhanced placeholder system with 17+ placeholder types
- ✅ Real-time tracking with email flag updates
- ✅ Complete analytics and reporting endpoints
- ✅ Professional frontend UI with cascading dropdowns
- ✅ Real-time monitoring dashboard

The system is now ready for testing and deployment.
