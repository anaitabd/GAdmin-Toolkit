#!/bin/bash

# Test script for new email sending API endpoints
# This script verifies that the new endpoints are accessible and return expected responses

API_BASE="http://localhost:3000"

echo "==================================================================="
echo "Testing Email Sending API Endpoints"
echo "==================================================================="
echo ""

# Test 1: Check if server is running
echo "Test 1: Health Check"
echo "-------------------------------------------------------------------"
curl -s "${API_BASE}/health" | jq '.' || echo "Server not running or health endpoint failed"
echo ""
echo ""

# Test 2: Get root endpoint to verify email-send is listed
echo "Test 2: Root Endpoint - Verify email-send is listed"
echo "-------------------------------------------------------------------"
curl -s "${API_BASE}/" | jq '.endpoints' || echo "Root endpoint failed"
echo ""
echo ""

# Test 3: Get email sending status (should work even with empty database)
echo "Test 3: GET /api/email-send/status"
echo "-------------------------------------------------------------------"
curl -s "${API_BASE}/api/email-send/status" | jq '.' || echo "Status endpoint failed"
echo ""
echo ""

# Test 4: Test bulk recipients endpoint with empty array (should fail validation)
echo "Test 4: POST /api/email-send/bulk-recipients (empty array - should fail)"
echo "-------------------------------------------------------------------"
curl -s -X POST "${API_BASE}/api/email-send/bulk-recipients" \
  -H "Content-Type: application/json" \
  -d '{"emails": []}' | jq '.' || echo "Bulk recipients endpoint failed"
echo ""
echo ""

# Test 5: Test bulk recipients endpoint with valid emails
echo "Test 5: POST /api/email-send/bulk-recipients (valid emails)"
echo "-------------------------------------------------------------------"
curl -s -X POST "${API_BASE}/api/email-send/bulk-recipients" \
  -H "Content-Type: application/json" \
  -d '{"emails": ["test1@example.com", "test2@example.com", "test3@example.com"]}' | jq '.' || echo "Bulk recipients endpoint failed"
echo ""
echo ""

# Test 6: Test generate users endpoint without parameters (should fail validation)
echo "Test 6: POST /api/email-send/generate-users (missing params - should fail)"
echo "-------------------------------------------------------------------"
curl -s -X POST "${API_BASE}/api/email-send/generate-users" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.' || echo "Generate users endpoint failed"
echo ""
echo ""

# Test 7: Test Gmail API sending (should fail if prerequisites not met, which is expected)
echo "Test 7: POST /api/email-send/gmail-api (should fail due to missing prerequisites)"
echo "-------------------------------------------------------------------"
curl -s -X POST "${API_BASE}/api/email-send/gmail-api" \
  -H "Content-Type: application/json" | jq '.' || echo "Gmail API endpoint failed"
echo ""
echo ""

# Test 8: Test SMTP sending (should fail if prerequisites not met, which is expected)
echo "Test 8: POST /api/email-send/smtp (should fail due to missing prerequisites)"
echo "-------------------------------------------------------------------"
curl -s -X POST "${API_BASE}/api/email-send/smtp" \
  -H "Content-Type: application/json" | jq '.' || echo "SMTP endpoint failed"
echo ""
echo ""

echo "==================================================================="
echo "Test Suite Completed"
echo "==================================================================="
echo ""
echo "Note: Some tests are expected to fail with validation errors when"
echo "prerequisites (users, email data, templates) are not set up."
echo "The important thing is that the endpoints are accessible and"
echo "return proper JSON responses."
