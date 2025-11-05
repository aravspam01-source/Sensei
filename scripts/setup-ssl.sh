#!/bin/bash

# SSL Certificate Setup Script for Sensei
# This script sets up Let's Encrypt SSL certificates

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DOMAIN="${1:-yourdomain.com}"
EMAIL="${2:-admin@yourdomain.com}"

if [ "$DOMAIN" = "yourdomain.com" ]; then
    print_error "Please provide your domain name"
    echo "Usage: $0 yourdomain.com admin@yourdomain.com"
    exit 1
fi

print_success "Setting up SSL certificates for $DOMAIN"

# Install Certbot if not present
if ! command -v certbot &> /dev/null; then
    print_warning "Certbot not found. Installing..."

    # For Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    # For CentOS/RHEL
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot python3-certbot-nginx
    else
        print_error "Please install Certbot manually"
        echo "Visit: https://certbot.eff.org/instructions"
        exit 1
    fi
fi

# Stop Nginx to free up port 80
print_warning "Stopping Nginx to free up port 80..."
docker-compose -f docker-compose.prod.yml stop nginx

# Create webroot for Let's Encrypt challenge
mkdir -p /var/www/certbot
sudo chown -R $USER:$USER /var/www/certbot

# Get SSL certificate
print_success "Requesting SSL certificate from Let's Encrypt..."
sudo certbot certonly \
    --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Copy certificates to nginx directory
print_success "Copying certificates to nginx directory..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./nginx/ssl/
sudo chown $USER:$USER ./nginx/ssl/*.pem

# Set up auto-renewal
print_success "Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f $(pwd)/docker-compose.prod.yml restart nginx") | crontab -

# Restart Nginx
print_success "Restarting Nginx with new SSL certificates..."
docker-compose -f docker-compose.prod.yml start nginx

# Verify certificates
if [ -f "./nginx/ssl/fullchain.pem" ] && [ -f "./nginx/ssl/privkey.pem" ]; then
    print_success "SSL certificates setup completed successfully!"
    echo ""
    echo "📋 Certificate details:"
    openssl x509 -in ./nginx/ssl/fullchain.pem -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:)"
    echo ""
    echo "🔄 Auto-renewal is configured via cron"
    echo "🌐 Your site should now be accessible at: https://$DOMAIN"
else
    print_error "SSL certificate setup failed!"
    exit 1
fi