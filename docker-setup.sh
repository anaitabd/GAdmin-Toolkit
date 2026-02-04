#!/bin/bash

# Docker Validation and Quick Start Script for GAdmin-Toolkit
# This script validates your Docker setup and helps you get started

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    print_header "Checking Docker Installation"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Please install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    print_success "Docker is installed: $(docker --version)"
    
    if ! docker ps &> /dev/null; then
        print_error "Docker daemon is not running"
        echo "Please start Docker and try again"
        exit 1
    fi
    
    print_success "Docker daemon is running"
}

# Check if Docker Compose is installed
check_docker_compose() {
    print_header "Checking Docker Compose Installation"
    
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Docker Compose is installed: $(docker compose version)"
}

# Check .env file
check_env_file() {
    print_header "Checking Environment Configuration"
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found"
        echo "Creating .env file from .env.example..."
        cp .env.example .env
        print_success ".env file created"
        print_warning "IMPORTANT: Please edit .env file and update the following:"
        echo "  - JWT_SECRET (use: openssl rand -base64 64)"
        echo "  - MONGO_ROOT_PASSWORD (set a strong password)"
        echo "  - GOOGLE_ADMIN_USER (your Google Workspace admin email)"
        echo ""
        read -p "Press Enter to continue after editing .env file..."
    else
        print_success ".env file exists"
        
        # Check for default values that should be changed
        if grep -q "your_jwt_secret_here" .env; then
            print_warning "JWT_SECRET still has default value - please update it!"
        fi
        
        if grep -q "your_secure_password" .env; then
            print_warning "DB_PASSWORD still has default value - please update it!"
        fi
        
        if grep -q "your_encryption_key_here" .env; then
            print_warning "ENCRYPTION_KEY still has default value - please update it!"
        fi
    fi
}

# Validate docker-compose.yml
validate_compose_file() {
    print_header "Validating Docker Compose Configuration"
    
    if docker compose config --quiet; then
        print_success "docker-compose.yml is valid"
    else
        print_error "docker-compose.yml has errors"
        exit 1
    fi
}

# Check available ports
check_ports() {
    print_header "Checking Available Ports"
    
    check_port() {
        local port=$1
        local service=$2
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
            print_warning "Port $port is already in use (needed for $service)"
            echo "You may need to stop the service using this port or change the port in .env"
            return 1
        else
            print_success "Port $port is available ($service)"
            return 0
        fi
    }
    
    check_port 3000 "API Server" || true
    check_port 3001 "Frontend" || true
    check_port 5432 "PostgreSQL" || true
    check_port 6379 "Redis" || true
}

# Build images
build_images() {
    print_header "Building Docker Images"
    
    print_info "Building API image..."
    if docker compose build api; then
        print_success "API image built successfully"
    else
        print_error "Failed to build API image"
        exit 1
    fi
    
    print_info "Building orchestrator image..."
    if docker compose build orchestrator; then
        print_success "Orchestrator image built successfully"
    else
        print_error "Failed to build orchestrator image"
        exit 1
    fi
    
    print_info "Building scheduler image..."
    if docker compose build scheduler; then
        print_success "Scheduler image built successfully"
    else
        print_error "Failed to build scheduler image"
        exit 1
    fi
    
    print_info "Building frontend image..."
    if docker compose build frontend; then
        print_success "Frontend image built successfully"
    else
        print_error "Failed to build frontend image"
        exit 1
    fi
}

# Start services
start_services() {
    print_header "Starting Services"
    
    print_info "Starting all services..."
    docker compose up -d
    
    print_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check service health
    print_header "Service Status"
    docker compose ps
}

# Setup admin user
setup_admin() {
    print_header "Admin User Setup"
    
    read -p "Do you want to create an admin user? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter admin username (default: admin): " username
        username=${username:-admin}
        
        read -s -p "Enter admin password: " password
        echo
        
        if [ -z "$password" ]; then
            print_error "Password cannot be empty"
            return 1
        fi
        
        print_info "Creating admin user..."
        if docker compose exec -T api node src/scripts/quickCreateAdmin.js "$username" "$password"; then
            print_success "Admin user created successfully!"
        else
            print_warning "Admin user may already exist or there was an error"
        fi
    fi
}

# Display access information
display_access_info() {
    print_header "Access Information"
    
    echo "Your GAdmin-Toolkit is now running!"
    echo ""
    echo -e "Frontend:      ${GREEN}http://localhost:3001${NC}"
    echo -e "API Server:    ${GREEN}http://localhost:3000${NC}"
    echo -e "Health Check:  ${GREEN}http://localhost:3000/health${NC}"
    echo -e "PostgreSQL:    ${GREEN}localhost:5432${NC}"
    echo -e "Redis:         ${GREEN}localhost:6379${NC}"
    echo ""
    echo "Useful commands:"
    echo "  View logs:          docker compose logs -f"
    echo "  Stop services:      docker compose stop"
    echo "  Restart services:   docker compose restart"
    echo "  Remove everything:  docker compose down -v"
    echo ""
    echo "For more information, see DOCKER_GUIDE.md"
}

# Main function
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════╗"
    echo "║   GAdmin-Toolkit Docker Setup & Validation    ║"
    echo "╚════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_docker
    check_docker_compose
    check_env_file
    validate_compose_file
    check_ports
    
    echo ""
    read -p "Do you want to build and start the services? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_images
        start_services
        setup_admin
        display_access_info
    else
        print_info "Skipping service startup"
        print_info "To start manually, run: docker compose up -d"
    fi
    
    print_success "Setup complete!"
}

# Run main function
main
