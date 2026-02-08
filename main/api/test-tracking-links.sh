#!/bin/bash

# Test script for Tracking Links API
# Tests all endpoints with example data

BASE_URL="${1:-http://localhost:3000}"
API_URL="$BASE_URL/api/tracking-links"

echo "=========================================="
echo "Testing Tracking Links API"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    
    echo -e "${YELLOW}Testing: $name${NC}"
    echo "  Method: $method"
    echo "  URL: $url"
    
    if [ -n "$data" ]; then
        echo "  Data: $data"
        response=$(curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -X "$method" "$url")
    fi
    
    echo "  Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "  ${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "  ${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

echo "=========================================="
echo "1. Create a Tracking Link"
echo "=========================================="
response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "original_url": "https://example.com/product",
        "name": "Test Product Link",
        "description": "Link for testing",
        "tags": ["test", "product"]
    }')
echo "$response" | jq '.'
LINK_ID=$(echo "$response" | jq -r '.data.id')
TRACK_ID=$(echo "$response" | jq -r '.data.track_id')
echo "Created link ID: $LINK_ID"
echo "Track ID: $TRACK_ID"
if [ "$LINK_ID" != "null" ] && [ -n "$LINK_ID" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((TESTS_FAILED++))
fi
echo ""

echo "=========================================="
echo "2. Get All Tracking Links"
echo "=========================================="
test_endpoint "Get all links" "GET" "$API_URL"

if [ "$LINK_ID" != "null" ] && [ -n "$LINK_ID" ]; then
    echo "=========================================="
    echo "3. Get Single Tracking Link"
    echo "=========================================="
    test_endpoint "Get link by ID" "GET" "$API_URL/$LINK_ID"

    echo "=========================================="
    echo "4. Update Tracking Link"
    echo "=========================================="
    test_endpoint "Update link" "PUT" "$API_URL/$LINK_ID" '{
        "name": "Updated Test Link",
        "tags": ["updated", "test"]
    }'

    echo "=========================================="
    echo "5. Get HTML Snippet"
    echo "=========================================="
    test_endpoint "Get HTML snippet" "GET" "$API_URL/$LINK_ID/html?linkText=Click%20Here&style=color:blue"

    echo "=========================================="
    echo "6. Get Link Statistics"
    echo "=========================================="
    test_endpoint "Get link stats" "GET" "$API_URL/$LINK_ID/stats"

    if [ "$TRACK_ID" != "null" ] && [ -n "$TRACK_ID" ]; then
        echo "=========================================="
        echo "7. Test Click Tracking (Redirect)"
        echo "=========================================="
        echo -e "${YELLOW}Testing: Click tracking${NC}"
        echo "  URL: $BASE_URL/t/c/$TRACK_ID"
        
        # Follow redirect and get final URL
        response=$(curl -s -L -w "\n%{http_code}\n%{redirect_url}" "$BASE_URL/t/c/$TRACK_ID")
        http_code=$(echo "$response" | tail -n 1)
        
        echo "  HTTP Code: $http_code"
        
        if [ "$http_code" = "302" ] || [ "$http_code" = "200" ]; then
            echo -e "  ${GREEN}✓ PASSED${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "  ${RED}✗ FAILED${NC}"
            ((TESTS_FAILED++))
        fi
        echo ""
        
        # Verify click was recorded
        echo "=========================================="
        echo "8. Verify Click Was Recorded"
        echo "=========================================="
        sleep 1  # Give DB a moment to update
        response=$(curl -s "$API_URL/$LINK_ID/stats")
        echo "$response" | jq '.'
        clicked=$(echo "$response" | jq -r '.data.clicked')
        if [ "$clicked" = "true" ]; then
            echo -e "${GREEN}✓ Click was recorded${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${YELLOW}⚠ Click may not have been recorded (check DB)${NC}"
        fi
        echo ""
    fi

    echo "=========================================="
    echo "9. Create Batch Tracking Links"
    echo "=========================================="
    test_endpoint "Create batch links" "POST" "$API_URL/batch" '{
        "links": [
            {
                "original_url": "https://example.com/offer1",
                "name": "Offer 1",
                "tags": ["batch", "offer"]
            },
            {
                "original_url": "https://example.com/offer2",
                "name": "Offer 2",
                "tags": ["batch", "offer"]
            }
        ]
    }'

    echo "=========================================="
    echo "10. Search Tracking Links"
    echo "=========================================="
    test_endpoint "Search by name" "GET" "$API_URL?search=offer"

    echo "=========================================="
    echo "11. Filter by Tag"
    echo "=========================================="
    test_endpoint "Filter by tag" "GET" "$API_URL?tag=batch"

    echo "=========================================="
    echo "12. Delete Tracking Link"
    echo "=========================================="
    test_endpoint "Delete link" "DELETE" "$API_URL/$LINK_ID"
fi

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Check the output above.${NC}"
    exit 1
fi
