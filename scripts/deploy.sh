#!/bin/bash

# Sensei Self-Hosted Deployment Script
# This script handles the complete deployment process

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.production .env
    print_warning "Please edit .env file with your configuration before continuing."
    echo "Required variables to update:"
    echo "  - POSTGRES_PASSWORD"
    echo "  - REDIS_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - FRONTEND_URL (your domain)"
    echo ""
    read -p "Press Enter after editing .env file to continue..."
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=("POSTGRES_PASSWORD" "REDIS_PASSWORD" "JWT_SECRET" "FRONTEND_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    print_error "Missing required environment variables: ${missing_vars[*]}"
    print_error "Please update .env file and try again."
    exit 1
fi

print_status "Starting Sensei deployment..."

# Create necessary directories
print_status "Creating directories..."
mkdir -p nginx/ssl postgres/init scripts logs uploads

# Set proper permissions
chmod 755 nginx postgres/init scripts logs uploads
chmod +x scripts/*.sh

# Generate self-signed SSL certificates (for initial deployment)
if [ ! -f "nginx/ssl/fullchain.pem" ]; then
    print_status "Generating self-signed SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/privkey.pem \
        -out nginx/ssl/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=${FRONTEND_URL#}"
    print_warning "Self-signed certificates created. Replace with proper certificates for production."
fi

# Update Nginx configuration with domain
print_status "Configuring Nginx for domain: ${FRONTEND_URL}"
sed -i "s/yourdomain.com/${FRONTED_URL}/g" nginx/conf.d/default.conf

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Build and start containers
print_status "Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 10

# Check if containers are running
print_status "Checking container status..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_success "Containers are running successfully!"
else
    print_error "Some containers failed to start. Check logs:"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma db push
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma generate

# Create initial admin user (optional)
print_status "Creating database schema..."
docker-compose -f docker-compose.prod.yml exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Check if we need to create initial data
    const userCount = await prisma.user.count();
    console.log(\`📊 Current user count: \${userCount}\`);

    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
" || print_warning "Database setup script failed, but deployment may still work"

# Check health endpoints
print_status "Checking service health..."
sleep 15

# Check backend health
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Backend health check passed!"
else
    print_warning "Backend health check failed. Check logs: docker-compose logs backend"
fi

# Show deployment summary
print_success "🎉 Sensei deployment completed successfully!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: ${FRONTEND_URL}"
echo "   API: ${FRONTEND_URL}/api"
echo "   Health: ${FRONTEND_URL}/health"
echo ""
echo "🔧 Management commands:"
echo "   View logs:      docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services:  docker-compose -f docker-compose.prod.yml down"
echo "   Restart:       docker-compose -f docker-compose.prod.yml restart"
echo "   Backup DB:      docker-compose -f docker-compose.prod.yml exec -T backend npm run backup"
echo ""
echo "📋 Next steps:"
echo "   1. Replace self-signed SSL certificates with proper ones"
echo "   2. Configure your domain DNS to point to this server"
echo "   3. Set up monitoring and alerts"
echo "   4. Configure regular backups"
echo ""
echo "📖 Documentation: Check README.md for detailed usage instructions"