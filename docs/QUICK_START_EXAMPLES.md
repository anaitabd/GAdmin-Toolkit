# Quick Start Examples

Real-world examples for common use cases.

## Example 1: Create 100 Google Workspace Users

```bash
# Step 1: Add your service account credentials (one-time setup)
curl -X POST http://localhost:3000/api/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Service Account",
    "domain": "mycompany.com",
    "cred_json": {
      "type": "service_account",
      "project_id": "my-project",
      "private_key_id": "key123",
      "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
      "client_email": "admin@my-project.iam.gserviceaccount.com",
      "client_id": "123456789",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
    },
    "active": true
  }'

# Step 2: Generate 100 random users
curl -X POST http://localhost:3000/api/jobs/generate-users \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mycompany.com",
    "num_records": 100
  }'

# Step 3: Wait for generation to complete (check job 1)
curl http://localhost:3000/api/jobs/1

# Step 4: Create users in Google Workspace
curl -X POST http://localhost:3000/api/jobs/create-google-users \
  -H "Content-Type: application/json" \
  -d '{
    "admin_email": "admin@mycompany.com"
  }'

# Step 5: Monitor progress in real-time
curl -N http://localhost:3000/api/jobs/2/stream
```

## Example 2: Send Email Campaign with Tracking

```bash
# Step 1: Create tracking links for your offers
curl -X POST http://localhost:3000/api/tracking-links/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "links": [
      "https://mycompany.com/offer1",
      "https://mycompany.com/offer2",
      "https://mycompany.com/offer3"
    ]
  }'

# Save the tracking URLs from the response
# For example:
# http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000
# http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440001
# http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440002

# Step 2: Add email recipients
curl -X POST http://localhost:3000/api/jobs/bulk-emails \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      "customer1@example.com",
      "customer2@example.com",
      "customer3@example.com"
    ]
  }'

# Step 3: Create campaign with tracking URLs in HTML
curl -X POST http://localhost:3000/api/jobs/send-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail_api",
    "from_name": "Marketing Team",
    "subject": "Special Offer Inside!",
    "html_content": "<h1>Hello!</h1><p>Check out our offers:</p><ul><li><a href=\"http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440000\">Offer 1</a></li><li><a href=\"http://localhost:3000/t/c/550e8400-e29b-41d4-a716-446655440001\">Offer 2</a></li></ul>",
    "batch_size": 300,
    "campaign_name": "Summer Sale 2026"
  }'

# Step 4: Monitor campaign progress
curl http://localhost:3000/api/jobs/3

# Step 5: View click statistics
curl 'http://localhost:3000/api/tracking-links?clicked=true'

# Step 6: Get campaign stats
curl http://localhost:3000/api/jobs/3/stats
```

## Example 3: Clean Up Test Environment

```bash
# WARNING: This deletes ALL users except the admin!
# Only use in development/test environments

# Delete all users except admin
curl -X POST http://localhost:3000/api/jobs/delete-google-users \
  -H "Content-Type: application/json" \
  -d '{
    "admin_email": "admin@mycompany.com"
  }'

# Monitor deletion progress
curl -N http://localhost:3000/api/jobs/1/stream

# Clean up database users
curl -X DELETE http://localhost:3000/api/users/1
curl -X DELETE http://localhost:3000/api/users/2
# ... or use a loop to delete all
```

## Example 4: Detect and Handle Bounced Emails

```bash
# Step 1: Start bounce detection
curl -X POST http://localhost:3000/api/jobs/detect-bounces

# Step 2: Wait for completion
curl http://localhost:3000/api/jobs/1

# Step 3: View bounced emails
curl http://localhost:3000/api/bounce-logs

# Step 4: Get unique bounced emails
curl http://localhost:3000/api/bounce-logs | jq -r '.data[].email' | sort -u > bounced.txt

# Step 5: Remove bounced emails from recipients list
# (Manual or script-based cleanup)
```

## Example 5: A/B Testing with Tracking Links

```bash
# Create tracking links for A/B test variants
curl -X POST http://localhost:3000/api/tracking-links/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "links": [
      {
        "original_url": "https://mysite.com/landing-a",
        "to_email": "test-group-a@example.com"
      },
      {
        "original_url": "https://mysite.com/landing-b",
        "to_email": "test-group-b@example.com"
      }
    ]
  }'

# Save tracking URLs and use in emails

# Later, compare click rates
curl 'http://localhost:3000/api/tracking-links?to_email=test-group-a@example.com&clicked=true' | jq '.count'
curl 'http://localhost:3000/api/tracking-links?to_email=test-group-b@example.com&clicked=true' | jq '.count'
```

## Example 6: JavaScript Integration

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function createUserCampaign() {
  try {
    // 1. Generate users
    const genJob = await axios.post(`${API_BASE}/api/jobs/generate-users`, {
      domain: 'mycompany.com',
      num_records: 50
    });
    console.log('User generation started:', genJob.data);
    
    // 2. Wait for generation to complete
    let generationComplete = false;
    while (!generationComplete) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const status = await axios.get(`${API_BASE}/api/jobs/${genJob.data.data.id}`);
      console.log(`Generation progress: ${status.data.data.progress}%`);
      generationComplete = status.data.data.status === 'completed';
    }
    
    // 3. Create users in Google Workspace
    const createJob = await axios.post(`${API_BASE}/api/jobs/create-google-users`, {
      admin_email: 'admin@mycompany.com'
    });
    console.log('User creation started:', createJob.data);
    
    // 4. Monitor creation progress
    let creationComplete = false;
    while (!creationComplete) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const status = await axios.get(`${API_BASE}/api/jobs/${createJob.data.data.id}`);
      console.log(`Creation progress: ${status.data.data.progress}% (${status.data.data.processed_items}/${status.data.data.total_items})`);
      creationComplete = status.data.data.status === 'completed';
    }
    
    console.log('All users created successfully!');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run the campaign
createUserCampaign();
```

## Example 7: Python Integration

```python
import requests
import time

API_BASE = 'http://localhost:3000'

def create_tracking_links_and_campaign():
    # 1. Create tracking links
    response = requests.post(f'{API_BASE}/api/tracking-links/bulk', json={
        'links': [
            'https://example.com/product1',
            'https://example.com/product2',
            'https://example.com/product3'
        ]
    })
    links = response.json()['data']
    print(f"Created {len(links)} tracking links")
    
    # 2. Build HTML with tracking links
    html = '<h1>Our Products</h1><ul>'
    for link in links:
        html += f'<li><a href="{link["tracking_url"]}">Click here</a></li>'
    html += '</ul>'
    
    # 3. Add recipients
    requests.post(f'{API_BASE}/api/jobs/bulk-emails', json={
        'emails': ['user1@example.com', 'user2@example.com']
    })
    
    # 4. Send campaign
    campaign = requests.post(f'{API_BASE}/api/jobs/send-campaign', json={
        'provider': 'gmail_api',
        'from_name': 'Sales Team',
        'subject': 'Check out our products!',
        'html_content': html,
        'campaign_name': 'Product Launch'
    })
    
    job_id = campaign.json()['data']['id']
    print(f"Campaign started: Job ID {job_id}")
    
    # 5. Monitor progress
    while True:
        status = requests.get(f'{API_BASE}/api/jobs/{job_id}').json()['data']
        print(f"Status: {status['status']}, Progress: {status['progress']}%")
        
        if status['status'] in ['completed', 'failed', 'cancelled']:
            break
        
        time.sleep(5)
    
    # 6. Get statistics
    stats = requests.get(f'{API_BASE}/api/jobs/{job_id}/stats').json()['data']
    print(f"Campaign Stats:")
    print(f"  Sent: {stats['sent']}")
    print(f"  Failed: {stats['failed']}")
    print(f"  Clicks: {stats['total_clicks']}")
    print(f"  CTR: {stats['ctr']}%")

# Run the campaign
create_tracking_links_and_campaign()
```

## Example 8: Bash Automation Script

```bash
#!/bin/bash

# Complete automation: Generate users, create in Google Workspace, send campaign

API_BASE="http://localhost:3000"
DOMAIN="mycompany.com"
ADMIN_EMAIL="admin@mycompany.com"
NUM_USERS=50

echo "Starting user creation automation..."

# 1. Generate users
echo "Generating $NUM_USERS users..."
GEN_RESPONSE=$(curl -s -X POST ${API_BASE}/api/jobs/generate-users \
  -H "Content-Type: application/json" \
  -d "{\"domain\":\"${DOMAIN}\",\"num_records\":${NUM_USERS}}")

GEN_JOB_ID=$(echo $GEN_RESPONSE | jq -r '.data.id')
echo "Generation job ID: $GEN_JOB_ID"

# Wait for generation
while true; do
  STATUS=$(curl -s ${API_BASE}/api/jobs/${GEN_JOB_ID} | jq -r '.data.status')
  PROGRESS=$(curl -s ${API_BASE}/api/jobs/${GEN_JOB_ID} | jq -r '.data.progress')
  echo "Generation: $STATUS ($PROGRESS%)"
  
  if [ "$STATUS" = "completed" ]; then
    break
  fi
  
  sleep 2
done

# 2. Create users in Google Workspace
echo "Creating users in Google Workspace..."
CREATE_RESPONSE=$(curl -s -X POST ${API_BASE}/api/jobs/create-google-users \
  -H "Content-Type: application/json" \
  -d "{\"admin_email\":\"${ADMIN_EMAIL}\"}")

CREATE_JOB_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')
echo "Creation job ID: $CREATE_JOB_ID"

# Wait for creation
while true; do
  STATUS=$(curl -s ${API_BASE}/api/jobs/${CREATE_JOB_ID} | jq -r '.data.status')
  PROGRESS=$(curl -s ${API_BASE}/api/jobs/${CREATE_JOB_ID} | jq -r '.data.progress')
  PROCESSED=$(curl -s ${API_BASE}/api/jobs/${CREATE_JOB_ID} | jq -r '.data.processed_items')
  TOTAL=$(curl -s ${API_BASE}/api/jobs/${CREATE_JOB_ID} | jq -r '.data.total_items')
  echo "Creation: $STATUS ($PROGRESS%, $PROCESSED/$TOTAL)"
  
  if [ "$STATUS" = "completed" ]; then
    break
  fi
  
  sleep 3
done

echo "✓ All users created successfully!"
```

## Tips and Best Practices

1. **Use SSE for real-time monitoring:**
   ```bash
   curl -N http://localhost:3000/api/jobs/1/stream
   ```

2. **Always check job status before starting new operations:**
   ```bash
   curl http://localhost:3000/api/jobs/1
   ```

3. **Use jq for parsing JSON responses:**
   ```bash
   curl -s http://localhost:3000/api/jobs/1 | jq '.data.progress'
   ```

4. **Set BASE_URL in production:**
   ```bash
   export BASE_URL=https://your-domain.com
   ```

5. **Test with small batches first:**
   ```json
   {"num_records": 10}  // Test with 10 users first
   ```

6. **Monitor system resources during large operations:**
   ```bash
   htop  # or top
   ```

7. **Keep credentials secure:**
   ```bash
   chmod 600 credentials.json
   export GOOGLE_CRED_JSON_B64=$(base64 -w 0 credentials.json)
   ```

For more details, see:
- [API Documentation](../main/api/API_DOCUMENTATION.md)
- [Google Workspace Guide](GOOGLE_WORKSPACE_GUIDE.md)
