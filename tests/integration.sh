#!/bin/bash
# Integration tests for GAdmin Toolkit API
# Runs acceptance tests with curl to verify core functionality

set -e

BASE_URL="${BASE_URL:-http://localhost:3001/api}"
USER_TOKEN="${USER_TOKEN:-user-token-12345678-1234-1234-1234-123456789012}"
ADMIN_TOKEN="${ADMIN_TOKEN:-admin-token-87654321-4321-4321-4321-210987654321}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function assert_success() {
  local test_name=$1
  local response=$2
  local status=$(echo "$response" | jq -r '.status // empty')

  if [ "$status" = "success" ] || [ "$status" = "queued" ]; then
    echo -e "${GREEN}✓ $test_name${NC}"
    return 0
  else
    echo -e "${RED}✗ $test_name${NC}"
    echo "Response: $response"
    return 1
  fi
}

function assert_error() {
  local test_name=$1
  local http_code=$2
  local response=$3

  if [ "$http_code" != "200" ]; then
    echo -e "${GREEN}✓ $test_name (HTTP $http_code)${NC}"
    return 0
  else
    echo -e "${RED}✗ $test_name${NC}"
    echo "Response: $response"
    return 1
  fi
}

echo "========================================="
echo "GAdmin Toolkit Integration Tests"
echo "========================================="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Health check
echo "Test 1: Health check"
RESPONSE=$(curl -s "$BASE_URL/health")
assert_success "Health endpoint" "$RESPONSE"

# Test 2: List scripts (requires auth)
echo ""
echo "Test 2: List scripts"
RESPONSE=$(curl -s -H "Authorization: Bearer $USER_TOKEN" "$BASE_URL/scripts")
SCRIPT_COUNT=$(echo "$RESPONSE" | jq -r '.count')
if [ "$SCRIPT_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Scripts endpoint (found $SCRIPT_COUNT scripts)${NC}"
else
  echo -e "${RED}✗ Scripts endpoint (no scripts found)${NC}"
fi

# Test 3: Unauthorized access (no token)
echo ""
echo "Test 3: Unauthorized access without token"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/scripts")
assert_error "Rejected unauthorized request" "$HTTP_CODE" ""

# Test 4: Run sync script (generate_users - dryRun)
echo ""
echo "Test 4: Run sync script (generate_users with dryRun)"
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "domain": "test.com",
      "numRecords": 10
    },
    "dryRun": true,
    "runAsync": false
  }' \
  "$BASE_URL/../run/generate_users")

assert_success "Generate users (sync, dryRun)" "$RESPONSE"

# Test 5: Admin-only script without admin token
echo ""
echo "Test 5: Admin-only script denied to non-admin user"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"runAsync": true}' \
  "$BASE_URL/../run/delete_users")

if [ "$HTTP_CODE" = "403" ]; then
  echo -e "${GREEN}✓ Rejected non-admin access to delete_users${NC}"
else
  echo -e "${RED}✗ Expected 403, got $HTTP_CODE${NC}"
fi

# Test 6: Admin-only script with admin token (dryRun)
echo ""
echo "Test 6: Admin-only script with admin token (dryRun)"
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": true,
    "runAsync": false
  }' \
  "$BASE_URL/../run/delete_users")

assert_success "Delete users (dryRun)" "$RESPONSE"

# Test 7: Queue async job
echo ""
echo "Test 7: Queue async job (check_smtp)"
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"runAsync": true}' \
  "$BASE_URL/../run/check_smtp")

STATUS=$(echo "$RESPONSE" | jq -r '.status // empty')
JOB_ID=$(echo "$RESPONSE" | jq -r '.jobId // empty')

if [ "$STATUS" = "queued" ] && [ -n "$JOB_ID" ]; then
  echo -e "${GREEN}✓ Job queued with ID: $JOB_ID${NC}"

  # Test 8: Poll job status
  echo ""
  echo "Test 8: Poll job status"
  sleep 2
  JOB_RESPONSE=$(curl -s -H "Authorization: Bearer $USER_TOKEN" \
    "$BASE_URL/job/$JOB_ID")

  JOB_STATUS=$(echo "$JOB_RESPONSE" | jq -r '.job.status // empty')
  if [ -n "$JOB_STATUS" ]; then
    echo -e "${GREEN}✓ Job status: $JOB_STATUS${NC}"
  else
    echo -e "${RED}✗ Could not retrieve job status${NC}"
  fi
else
  echo -e "${RED}✗ Failed to queue job${NC}"
fi

# Test 9: Metrics endpoint
echo ""
echo "Test 9: Metrics endpoint"
RESPONSE=$(curl -s "$BASE_URL/metrics")
assert_success "Metrics endpoint" "$RESPONSE"

# Test 10: Invalid script name
echo ""
echo "Test 10: Invalid script name returns 403"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  "$BASE_URL/../run/nonexistent_script")

if [ "$HTTP_CODE" = "403" ]; then
  echo -e "${GREEN}✓ Rejected nonexistent script${NC}"
else
  echo -e "${RED}✗ Expected 403, got $HTTP_CODE${NC}"
fi

echo ""
echo "========================================="
echo "Integration tests complete!"
echo "========================================="

