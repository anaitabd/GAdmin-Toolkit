#!/bin/bash

# GAdmin Toolkit Setup Script
# This script helps set up the web application

set -e

echo "========================================="
echo "  GAdmin Toolkit - Web Application"
echo "  Setup Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_info() {
    echo -e "ℹ $1"
}

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    echo ""
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm installed: $NPM_VERSION"
    else
        print_error "npm not found"
        exit 1
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker installed: $DOCKER_VERSION"
        DOCKER_AVAILABLE=true
    else
        print_warning "Docker not found (optional for local development)"
        DOCKER_AVAILABLE=false
    fi
    
    echo ""
}

# Setup backend
setup_backend() {
    echo "========================================="
    echo "Setting up Backend..."
    echo "========================================="
    echo ""
    
    cd backend
    
    # Install dependencies
    print_info "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        print_info "Creating .env file from template..."
        cp .env.example .env
        print_success ".env file created"
        print_warning "Please edit backend/.env with your configuration"
    else
        print_warning ".env file already exists"
    fi
    
    # Create necessary directories
    print_info "Creating necessary directories..."
    mkdir -p logs uploads src/models src/utils src/workers
    print_success "Directories created"
    
    cd ..
    echo ""
}

# Setup frontend
setup_frontend() {
    echo "========================================="
    echo "Setting up Frontend..."
    echo "========================================="
    echo ""
    
    cd frontend
    
    # Install dependencies
    print_info "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        print_info "Creating .env file..."
        echo "VITE_API_URL=http://localhost:5000/api" > .env
        print_success ".env file created"
    else
        print_warning ".env file already exists"
    fi
    
    cd ..
    echo ""
}

# Check Google credentials
check_credentials() {
    echo "========================================="
    echo "Checking Google Credentials..."
    echo "========================================="
    echo ""
    
    if [ -f "main/api/cred.json" ]; then
        print_success "Google credentials found"
    else
        print_error "Google credentials not found at main/api/cred.json"
        print_warning "Please place your Google service account credentials in main/api/cred.json"
    fi
    
    echo ""
}

# Create Docker env
setup_docker() {
    echo "========================================="
    echo "Setting up Docker configuration..."
    echo "========================================="
    echo ""
    
    if [ ! -f .env ]; then
        print_info "Creating Docker .env file..."
        cp .env.docker.example .env
        print_success "Docker .env created"
        print_warning "Please edit .env with your configuration"
    else
        print_warning "Docker .env already exists"
    fi
    
    echo ""
}

# Display next steps
show_next_steps() {
    echo "========================================="
    echo "Setup Complete!"
    echo "========================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Configure your settings:"
    echo "   - Edit backend/.env with your configuration"
    echo "   - Ensure main/api/cred.json contains your Google credentials"
    echo ""
    echo "2. Start the application:"
    echo ""
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "   Option A: Using Docker (Recommended)"
        echo "   $ docker-compose up -d"
        echo ""
    fi
    echo "   Option B: Manual start"
    echo "   Terminal 1: cd backend && npm run dev"
    echo "   Terminal 2: cd frontend && npm run dev"
    echo ""
    echo "3. Access the application:"
    echo "   - Frontend: http://localhost:3000 (dev) or http://localhost (Docker)"
    echo "   - Backend API: http://localhost:5000"
    echo "   - API Docs: http://localhost:5000/api-docs"
    echo ""
    echo "4. Default login credentials:"
    echo "   - Username: admin"
    echo "   - Password: admin123 (change this!)"
    echo ""
    echo "For more information, see:"
    echo "   - README.md"
    echo "   - backend/README.md"
    echo "   - frontend/README.md"
    echo "   - MIGRATION_GUIDE.md"
    echo ""
    print_success "Setup completed successfully!"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    setup_backend
    setup_frontend
    check_credentials
    
    if [ "$DOCKER_AVAILABLE" = true ]; then
        setup_docker
    fi
    
    show_next_steps
}

# Run main function
main
