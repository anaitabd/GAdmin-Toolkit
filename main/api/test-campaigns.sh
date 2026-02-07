#!/bin/bash

# Test script for Campaign Management API
# This script tests the admin users and campaigns endpoints

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "Campaign Management API Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test 1: Create Admin User
print_test "Creating admin user..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin-users" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testadmin",
    "email": "testadmin@example.com",
    "password": "TestPass123",
    "full_name": "Test Admin",
    "role": "admin"
  }')

if echo "$ADMIN_RESPONSE" | grep -q "success.*true"; then
    print_success "Admin user created"
    ADMIN_ID=$(echo "$ADMIN_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    echo "Admin ID: $ADMIN_ID"
else
    print_error "Failed to create admin user"
    echo "$ADMIN_RESPONSE"
fi
echo ""

# Test 2: Get All Admin Users
print_test "Getting all admin users..."
ADMIN_LIST=$(curl -s "$BASE_URL/api/admin-users")
if echo "$ADMIN_LIST" | grep -q "success.*true"; then
    print_success "Retrieved admin users"
    echo "$ADMIN_LIST" | jq -r '.data[] | "- \(.username) (\(.email)) - \(.role)"' 2>/dev/null || echo "$ADMIN_LIST"
else
    print_error "Failed to get admin users"
fi
echo ""

# Test 3: Get Active Admin Users
print_test "Getting active admin users..."
ACTIVE_ADMINS=$(curl -s "$BASE_URL/api/admin-users/active")
if echo "$ACTIVE_ADMINS" | grep -q "success.*true"; then
    print_success "Retrieved active admin users"
else
    print_error "Failed to get active admin users"
fi
echo ""

# Test 4: Create a Campaign (without recipients)
print_test "Creating a campaign..."
CAMPAIGN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/campaigns" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Campaign $(date +%s)\",
    \"description\": \"Test campaign for validation\",
    \"created_by\": $ADMIN_ID
  }")

if echo "$CAMPAIGN_RESPONSE" | grep -q "success.*true"; then
    print_success "Campaign created"
    CAMPAIGN_ID=$(echo "$CAMPAIGN_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    echo "Campaign ID: $CAMPAIGN_ID"
else
    print_error "Failed to create campaign"
    echo "$CAMPAIGN_RESPONSE"
fi
echo ""

# Test 5: Get All Campaigns
print_test "Getting all campaigns..."
CAMPAIGN_LIST=$(curl -s "$BASE_URL/api/campaigns")
if echo "$CAMPAIGN_LIST" | grep -q "success.*true"; then
    print_success "Retrieved campaigns"
    echo "$CAMPAIGN_LIST" | jq -r '.data[] | "- \(.name) [\(.status)] - \(.total_recipients) recipients"' 2>/dev/null || echo "$CAMPAIGN_LIST"
else
    print_error "Failed to get campaigns"
fi
echo ""

# Test 6: Get Campaign by ID
if [ ! -z "$CAMPAIGN_ID" ]; then
    print_test "Getting campaign by ID..."
    CAMPAIGN_DETAIL=$(curl -s "$BASE_URL/api/campaigns/$CAMPAIGN_ID")
    if echo "$CAMPAIGN_DETAIL" | grep -q "success.*true"; then
        print_success "Retrieved campaign details"
        echo "$CAMPAIGN_DETAIL" | jq '.data | {id, name, status, total_recipients, created_at}' 2>/dev/null || echo "$CAMPAIGN_DETAIL"
    else
        print_error "Failed to get campaign details"
    fi
    echo ""
fi

# Test 7: Get Campaign Statistics
if [ ! -z "$CAMPAIGN_ID" ]; then
    print_test "Getting campaign statistics..."
    CAMPAIGN_STATS=$(curl -s "$BASE_URL/api/campaigns/$CAMPAIGN_ID/stats")
    if echo "$CAMPAIGN_STATS" | grep -q "success.*true"; then
        print_success "Retrieved campaign statistics"
        echo "$CAMPAIGN_STATS" | jq '.statistics' 2>/dev/null || echo "$CAMPAIGN_STATS"
    else
        print_error "Failed to get campaign statistics"
    fi
    echo ""
fi

# Test 8: Update Campaign
if [ ! -z "$CAMPAIGN_ID" ]; then
    print_test "Updating campaign..."
    UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/campaigns/$CAMPAIGN_ID" \
      -H "Content-Type: application/json" \
      -d '{
        "description": "Updated test campaign description"
      }')
    if echo "$UPDATE_RESPONSE" | grep -q "success.*true"; then
        print_success "Campaign updated"
    else
        print_error "Failed to update campaign"
    fi
    echo ""
fi

# Test 9: Get Campaigns by Status
print_test "Getting draft campaigns..."
DRAFT_CAMPAIGNS=$(curl -s "$BASE_URL/api/campaigns?status=draft")
if echo "$DRAFT_CAMPAIGNS" | grep -q "success.*true"; then
    print_success "Retrieved draft campaigns"
    COUNT=$(echo "$DRAFT_CAMPAIGNS" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
    echo "Found $COUNT draft campaigns"
else
    print_error "Failed to get draft campaigns"
fi
echo ""

# Test 10: Clean up - Delete Campaign
if [ ! -z "$CAMPAIGN_ID" ]; then
    print_test "Deleting campaign..."
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/campaigns/$CAMPAIGN_ID")
    if echo "$DELETE_RESPONSE" | grep -q "success.*true"; then
        print_success "Campaign deleted"
    else
        print_error "Failed to delete campaign"
    fi
    echo ""
fi

# Test 11: Clean up - Delete Admin User
if [ ! -z "$ADMIN_ID" ]; then
    print_test "Deleting admin user..."
    DELETE_ADMIN=$(curl -s -X DELETE "$BASE_URL/api/admin-users/$ADMIN_ID")
    if echo "$DELETE_ADMIN" | grep -q "success.*true"; then
        print_success "Admin user deleted"
    else
        print_error "Failed to delete admin user"
    fi
    echo ""
fi

echo "=========================================="
echo "Campaign Management API Test Complete"
echo "=========================================="
