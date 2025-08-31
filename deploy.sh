#!/bin/bash

# Deploy script for hsduarte.com to Hetzner server
# Usage: ./deploy.sh [server_ip] [username]

set -e

# Configuration
SERVER_IP=${1:-"your-server-ip"}
USERNAME=${2:-"root"}
APP_NAME="hsduarte-website"
REMOTE_DIR="/opt/hsduarte"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required parameters are provided
if [ "$SERVER_IP" = "your-server-ip" ]; then
    echo_error "Please provide server IP address"
    echo "Usage: ./deploy.sh <server_ip> [username]"
    exit 1
fi

echo_info "Starting deployment to $USERNAME@$SERVER_IP"

# Build the application locally
echo_info "Building application..."
npm run build

# Create deployment archive
echo_info "Creating deployment archive..."
tar -czf deploy.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.angular \
    --exclude=dist/hs-duarte/browser \
    dist/ \
    package.json \
    package-lock.json \
    Dockerfile \
    docker-compose.yml \
    nginx.conf

# Upload files to server
echo_info "Uploading files to server..."
scp deploy.tar.gz $USERNAME@$SERVER_IP:/tmp/

# Execute deployment on server
echo_info "Executing deployment on server..."
ssh $USERNAME@$SERVER_IP << EOF
    set -e
    
    # Create application directory
    mkdir -p $REMOTE_DIR
    cd $REMOTE_DIR
    
    # Extract files
    tar -xzf /tmp/deploy.tar.gz
    
    # Stop existing containers
    if [ -f docker-compose.yml ]; then
        docker-compose down || true
    fi
    
    # Build and start new containers
    docker-compose build --no-cache
    docker-compose up -d
    
    # Clean up
    rm /tmp/deploy.tar.gz
    docker system prune -f
    
    echo "Deployment completed successfully!"
EOF

# Clean up local files
rm deploy.tar.gz

echo_info "Deployment completed!"
echo_info "Your site should be available at: http://$SERVER_IP:4000"
echo_warn "Don't forget to:"
echo_warn "1. Configure your DNS to point to $SERVER_IP"
echo_warn "2. Set up SSL certificates in the ssl/ directory"
echo_warn "3. Update nginx.conf with your actual domain name"