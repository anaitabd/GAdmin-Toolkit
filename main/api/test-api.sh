#!/bin/bash

# API Testing Script for GAdmin-Toolkit
# This script demonstrates all available API endpoints

API_URL="${API_URL:-http://localhost:3000}"

echo "=========================================="
echo "GAdmin-Toolkit API Testing Script"
echo "=========================================="
echo ""
echo "API Base URL: $API_URL"
echo ""

# Test health endpoint
echo "1. Testing Health Check:"
echo "   GET $API_URL/health"
curl -s "$API_URL/health" | jq .
echo ""

# Test root endpoint
echo "2. Testing Root Endpoint:"
echo "   GET $API_URL/"
curl -s "$API_URL/" | jq .
echo ""

echo "=========================================="
echo "User Management Endpoints"
echo "=========================================="

# Test GET all users
echo "3. Get All Users:"
echo "   GET $API_URL/api/users"
curl -s "$API_URL/api/users" | jq .
echo ""

# Test POST create user
echo "4. Create New User:"
echo "   POST $API_URL/api/users"
curl -s -X POST "$API_URL/api/users" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123","given_name":"John","family_name":"Doe"}' | jq .
echo ""

# Test GET user by ID
echo "5. Get User by ID (example: ID=1):"
echo "   GET $API_URL/api/users/1"
curl -s "$API_URL/api/users/1" | jq .
echo ""

echo "=========================================="
echo "Email Data Management Endpoints"
echo "=========================================="

# Test GET all email data
echo "6. Get All Email Data:"
echo "   GET $API_URL/api/email-data"
curl -s "$API_URL/api/email-data" | jq .
echo ""

# Test POST create email data
echo "7. Create New Email Data:"
echo "   POST $API_URL/api/email-data"
curl -s -X POST "$API_URL/api/email-data" \
  -H "Content-Type: application/json" \
  -d '{"to_email":"recipient@example.com"}' | jq .
echo ""

echo "=========================================="
echo "Email Info Management Endpoints"
echo "=========================================="

# Test GET active email info
echo "8. Get Active Email Info:"
echo "   GET $API_URL/api/email-info/active"
curl -s "$API_URL/api/email-info/active" | jq .
echo ""

# Test POST create email info
echo "9. Create New Email Info:"
echo "   POST $API_URL/api/email-info"
curl -s -X POST "$API_URL/api/email-info" \
  -H "Content-Type: application/json" \
  -d '{"from_name":"Admin","subject":"Test Email","active":true}' | jq .
echo ""

echo "=========================================="
echo "Email Templates Management Endpoints"
echo "=========================================="

# Test GET active template
echo "10. Get Active Email Template:"
echo "    GET $API_URL/api/email-templates/active"
curl -s "$API_URL/api/email-templates/active" | jq .
echo ""

# Test POST create template
echo "11. Create New Email Template:"
echo "    POST $API_URL/api/email-templates"
curl -s -X POST "$API_URL/api/email-templates" \
  -H "Content-Type: application/json" \
  -d '{"name":"Welcome Email","html_content":"<h1>Welcome!</h1>","active":true}' | jq .
echo ""

echo "=========================================="
echo "Names Management Endpoints"
echo "=========================================="

# Test GET all names
echo "12. Get All Names:"
echo "    GET $API_URL/api/names"
curl -s "$API_URL/api/names" | jq .
echo ""

# Test POST create name
echo "13. Create New Name:"
echo "    POST $API_URL/api/names"
curl -s -X POST "$API_URL/api/names" \
  -H "Content-Type: application/json" \
  -d '{"given_name":"Jane","family_name":"Smith"}' | jq .
echo ""

echo "=========================================="
echo "Email Logs (Read-Only) Endpoints"
echo "=========================================="

# Test GET all email logs
echo "14. Get Email Logs:"
echo "    GET $API_URL/api/email-logs?limit=10"
curl -s "$API_URL/api/email-logs?limit=10" | jq .
echo ""

# Test GET email logs stats
echo "15. Get Email Logs Statistics:"
echo "    GET $API_URL/api/email-logs/stats/summary"
curl -s "$API_URL/api/email-logs/stats/summary" | jq .
echo ""

echo "=========================================="
echo "Bounce Logs (Read-Only) Endpoints"
echo "=========================================="

# Test GET all bounce logs
echo "16. Get Bounce Logs:"
echo "    GET $API_URL/api/bounce-logs?limit=10"
curl -s "$API_URL/api/bounce-logs?limit=10" | jq .
echo ""

# Test GET bounce logs stats
echo "17. Get Bounce Logs Statistics:"
echo "    GET $API_URL/api/bounce-logs/stats/summary"
curl -s "$API_URL/api/bounce-logs/stats/summary" | jq .
echo ""

echo "=========================================="
echo "API Testing Complete!"
echo "=========================================="
