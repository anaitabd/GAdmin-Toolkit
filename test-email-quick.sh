#!/bin/bash

# Quick start script for testing email functionality
# This script helps you quickly test the email sending and test email features

echo "=========================================="
echo "GAdmin-Toolkit Email Testing Quick Start"
echo "=========================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "⚠️  Server is not running. Please start it first:"
    echo "   cd main/api && node server.js"
    echo ""
    exit 1
fi

echo "✓ Server is running"
echo ""

# Display menu
echo "Choose an option:"
echo "1. Send test email (SMTP)"
echo "2. Send test email (Gmail API)"
echo "3. Check email sending status"
echo "4. View recent email logs"
echo "5. Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "Sending test email via SMTP..."
        read -p "Enter test email address: " test_email
        
        response=$(curl -s -X POST http://localhost:3000/api/email-send/test-email \
            -H "Content-Type: application/json" \
            -d "{\"provider\": \"smtp\", \"test_email\": \"$test_email\"}")
        
        echo ""
        echo "Response:"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        ;;
    
    2)
        echo ""
        echo "Sending test email via Gmail API..."
        read -p "Enter test email address: " test_email
        
        response=$(curl -s -X POST http://localhost:3000/api/email-send/test-email \
            -H "Content-Type: application/json" \
            -d "{\"provider\": \"gmail_api\", \"test_email\": \"$test_email\"}")
        
        echo ""
        echo "Response:"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        ;;
    
    3)
        echo ""
        echo "Fetching email sending status..."
        curl -s http://localhost:3000/api/email-send/status | python3 -m json.tool 2>/dev/null
        ;;
    
    4)
        echo ""
        echo "Fetching recent email logs..."
        curl -s 'http://localhost:3000/api/email-logs?limit=10' | python3 -m json.tool 2>/dev/null
        ;;
    
    5)
        echo "Exiting..."
        exit 0
        ;;
    
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "For more information, see:"
echo "  - docs/EMAIL_TESTING_GUIDE.md"
echo "  - main/api/API_DOCUMENTATION.md"
echo "=========================================="
