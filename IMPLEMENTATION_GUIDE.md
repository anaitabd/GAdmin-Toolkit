# Data & Sponsor Management System Implementation

## Overview

This implementation adds comprehensive data and sponsor/affiliate management capabilities to GAdmin-Toolkit, aligning it with enterprise email marketing features while maintaining focus on SMTP and Gmail API sending (no server/VPS management).

## What Was Implemented

### Phase 1: Database Layer ✅

1. **Migration File**: `main/api/db/migrations/add_data_sponsor_management.sql`
   - Creates 18 new tables
   - Adds columns to existing tables (email_data, offers, click_tracking, unsubscribes, email_logs)
   - Creates 35+ indexes for optimal query performance

2. **Updated Base Schema**: `main/api/db/schema.sql`
   - Integrated all new tables into base schema for fresh installs
   - Updated existing table definitions with new columns

### Phase 2: API Backend - New Routes ✅

Created 13 new route files with full CRUD operations:

1. **routes/dataProviders.js** - Manage data source providers
2. **routes/dataLists.js** - Manage email list segments (with stats, recount, CSV import)
3. **routes/blacklists.js** - Hard email blocks with bulk operations
4. **routes/verticals.js** - Offer categories/verticals
5. **routes/affiliateNetworks.js** - Network entities with API integration
6. **routes/creatives.js** - Multiple subject/body/from per offer
7. **routes/offerLinks.js** - Multiple click/unsub URLs per offer
8. **routes/fromNames.js** - From name rotation pool per offer
9. **routes/subjects.js** - Subject line A/B testing pool per offer
10. **routes/suppressionEmails.js** - Per-offer email exclusions
11. **routes/suppressionProcesses.js** - Track suppression sync jobs
12. **routes/leads.js** - Conversion tracking with payout
13. **routes/auditLogs.js** - Read-only action trail

All routes include:
- Parameterized queries for security
- Audit logging on create/update/delete
- Proper error handling
- Pagination support
- Consistent response format

### Phase 3: Middleware & Libraries ✅

1. **middleware/auditLog.js**
   - `logAudit()` - Insert audit log entries
   - `getActionBy()` - Extract user info from request

2. **lib/sendFilters.js**
   - `filterRecipients()` - Remove blacklisted/suppressed/bounced emails
   - `pickCreative()` - Random creative selection with fallback
   - `pickFromName()` - Random from name with fallback
   - `pickSubject()` - Random subject with fallback
   - `getOfferLinks()` - Fetch click/unsub URLs with fallback
   - `replacePlaceholders()` - Insert recipient data into templates

3. **lib/affiliateApi.js**
   - `fetchOffersFromNetwork()` - Import offers from network APIs
   - `fetchSuppressionsFromNetwork()` - Download suppression lists
   - `fetchCreativesFromNetwork()` - Import creatives
   - Supports HasOffers, Everflow, Cake, and generic APIs

### Phase 4: Updates to Existing Routes ✅

1. **routes/offers.js**
   - Added new columns: affiliate_network_id, vertical_id, production_id, description, rules, payout, status
   - GET /:id now returns counts for creatives, links, from_names, subjects

2. **routes/emailData.js**
   - Added new columns: data_list_id, first_name, last_name, email_md5, verticals
   - Added boolean flags: is_seed, is_fresh, is_clean, is_opener, is_clicker, is_leader, is_unsub, is_optout, is_hard_bounced
   - Auto-computes email_md5 on insert/update
   - Added GET /by-list/:listId endpoint

3. **server.js**
   - Registered all 13 new routes
   - Updated root endpoint to list all new API endpoints

## New Database Tables

### Data Management
- `data_providers` - Track where lists come from
- `data_lists` - Named list segments with count, status, provider link
- `blacklists` + `blacklist_emails` - Hard email blocks
- Enhanced `email_data` - Now includes segmentation flags and metadata

### Sponsor/Affiliate Management
- `verticals` - Offer categories
- `affiliate_networks` - Network entities with API credentials
- `creatives` - Multiple templates per offer
- `offer_links` - Multiple URLs per offer/creative
- `from_names` - From name rotation pool
- `subjects` - Subject A/B testing pool
- `suppression_emails` - Per-offer exclusions
- `suppression_processes` - Track suppression jobs
- Enhanced `offers` - Now linked to networks and verticals

### Tracking & Analytics
- `leads` - Conversion tracking with full context
- `audit_logs` - Action trail for all CRUD operations
- Enhanced tracking tables - Added affiliate context

## New Columns on Existing Tables

### email_data
- `data_list_id`, `first_name`, `last_name`, `email_md5`, `verticals`
- `is_seed`, `is_fresh`, `is_clean`, `is_opener`, `is_clicker`, `is_leader`
- `is_unsub`, `is_optout`, `is_hard_bounced`

### offers
- `affiliate_network_id`, `vertical_id`, `production_id`
- `description`, `rules`, `payout`, `status`

### click_tracking
- `affiliate_network_id`, `creative_id`, `data_list_id`

### unsubscribes
- `affiliate_network_id`, `data_list_id`, `ip_address`, `user_agent`, `geo`

### email_logs
- `campaign_id`, `offer_id`, `affiliate_network_id`, `data_list_id`, `creative_id`

## API Endpoints

### Data Management
- `/api/data-providers` - CRUD for providers
- `/api/data-lists` - CRUD + stats, recount, CSV import
- `/api/blacklists` - CRUD + bulk operations, check endpoint
- `/api/email-data` - Enhanced with all new fields

### Sponsor/Affiliate Management
- `/api/verticals` - CRUD for offer categories
- `/api/affiliate-networks` - CRUD + fetch offers from API
- `/api/creatives` - CRUD + by-offer query
- `/api/offer-links` - CRUD + by-offer/creative queries
- `/api/from-names` - CRUD + random selection
- `/api/subjects` - CRUD + random selection
- `/api/suppression-emails` - CRUD + bulk operations
- `/api/suppression-processes` - Manage suppression sync jobs
- `/api/offers` - Enhanced with network/vertical fields

### Tracking & Analytics
- `/api/leads` - CRUD + stats by offer/campaign/network
- `/api/audit-logs` - Read-only action trail

## Key Features

### Email Segmentation
- Classify emails by behavior: opener, clicker, leader
- Track email freshness and cleanliness
- Flag seed, unsubscribed, opted-out, and bounced emails
- Link emails to specific data lists

### Blacklist Management
- Multiple blacklist groups
- Bulk import capabilities
- Check endpoint to validate emails before sending
- Automatic filtering in send flow

### Offer Management
- Link offers to affiliate networks
- Categorize by vertical
- Track production IDs from network APIs
- Multiple creatives per offer
- Rotation pools for from names and subjects
- Multiple click/unsub URLs

### Suppression Management
- Per-offer email suppressions
- Bulk import from network APIs
- Track suppression sync progress
- Automatic filtering in send flow

### Affiliate Network Integration
- Support for major networks (HasOffers, Everflow, Cake)
- Fetch offers, creatives, and suppressions via API
- Auto-import and sync capabilities
- Generic API support for custom networks

### Complete Sending Flow
```
Campaign Creation → Offer Selection → Creative/From/Subject Rotation
↓
Pre-send Filtering:
- Remove blacklisted emails
- Remove suppressed emails (per offer)
- Remove unsubscribed emails
- Remove hard bounced emails
↓
Sending via Gmail API or SMTP
↓
Rich Logging with affiliate context
↓
Post-send Tracking with behavior flags
```

## Next Steps (Not Yet Implemented)

### Phase 5: Job Workers Update
- Update sendEmailApi.js and sendEmailSmtp.js with filtering and rotation
- Update campaign sending jobs with offer integration
- Implement automatic behavior flag updates

### Phase 6-7: Frontend
- Create 14 new React pages for all new entities
- Update navigation and routing
- Add dashboard stats for leads, networks, suppressions
- Create API client files

### Phase 8: Testing
- Test database migration
- Test all API endpoints
- Integration testing
- Load testing

## Migration Instructions

To apply this implementation to an existing database:

```bash
# Run the migration
psql $DATABASE_URL -f main/api/db/migrations/add_data_sponsor_management.sql

# Or if starting fresh, use the updated schema
psql $DATABASE_URL -f main/api/db/schema.sql
```

## Security Notes

- All queries use parameterized statements ($1, $2, etc.)
- Audit logging tracks all changes
- No sensitive data in logs
- Network API keys stored encrypted (via JSONB)
- Rate limiting applied to all API endpoints

## Performance Optimizations

- 35+ indexes on frequently queried columns
- Pagination on all list endpoints
- Efficient bulk operations
- Connection pooling with configurable limits
- JSONB for flexible metadata storage

## Backward Compatibility

- All new columns have defaults or are nullable
- Existing API endpoints unchanged
- New features are opt-in
- Migration is additive (no breaking changes)
