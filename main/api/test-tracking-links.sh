#!/bin/bash

# Test Tracking Links API Endpoints
# This script tests the new tracking links functionality

API_BASE="http://localhost:3000"

echo "==================================="
echo "Testing Tracking Links API"
echo "==================================="
echo

# Test 1: Create a single tracking link
echo "Test 1: Create a single tracking link"
echo "-------------------------------------"
RESPONSE=$(curl -s -X POST ${API_BASE}/api/tracking-links \
  -H "Content-Type: application/json" \
  -d '{
    "original_url": "https://example.com/offer1",
    "to_email": "test@example.com"
  }')

echo "Response:"
echo "$RESPONSE" | jq '.'
TRACK_ID=$(echo "$RESPONSE" | jq -r '.data.track_id')
echo "Track ID: $TRACK_ID"
echo

# Test 2: Get tracking link details
echo "Test 2: Get tracking link details"
echo "-------------------------------------"
curl -s ${API_BASE}/api/tracking-links/${TRACK_ID} | jq '.'
echo

# Test 3: Create multiple tracking links
echo "Test 3: Create multiple tracking links"
echo "-------------------------------------"
curl -s -X POST ${API_BASE}/api/tracking-links/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "links": [
      {
        "original_url": "https://example.com/offer2",
        "to_email": "user1@example.com"
      },
      {
        "original_url": "https://example.com/offer3",
        "to_email": "user2@example.com"
      },
      "https://example.com/offer4"
    ]
  }' | jq '.'
echo

# Test 4: List all tracking links
echo "Test 4: List all tracking links"
echo "-------------------------------------"
curl -s ${API_BASE}/api/tracking-links | jq '.'
echo

# Test 5: List tracking links with filter
echo "Test 5: List tracking links with filter (to_email)"
echo "-------------------------------------"
curl -s "${API_BASE}/api/tracking-links?to_email=test@example.com" | jq '.'
echo

# Test 6: Simulate a click (this will redirect, so we just check status)
echo "Test 6: Simulate a click (checking redirect)"
echo "-------------------------------------"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L ${API_BASE}/t/c/${TRACK_ID})
echo "HTTP Status: $HTTP_STATUS (should be 200 if redirect works)"
echo

# Test 7: Verify click was recorded
echo "Test 7: Verify click was recorded"
echo "-------------------------------------"
curl -s ${API_BASE}/api/tracking-links/${TRACK_ID} | jq '.data | {clicked, clicked_at}'
echo

# Test 8: List clicked links
echo "Test 8: List clicked links"
echo "-------------------------------------"
CLICKED_COUNT=$(curl -s "${API_BASE}/api/tracking-links?clicked=true" | jq '.data | length')
echo "$CLICKED_COUNT clicked links found"
echo

# Test 9: Delete a tracking link
echo "Test 9: Delete a tracking link"
echo "-------------------------------------"
curl -s -X DELETE ${API_BASE}/api/tracking-links/${TRACK_ID} | jq '.'
echo

echo "==================================="
echo "All tests completed!"
echo "==================================="
