# 🏠 Sensei Self-Hosting Guide

Complete guide to deploy the Sensei visual story generator platform on your own infrastructure.

## 🚀 Quick Start

### Prerequisites

- **Server**: Linux (Ubuntu 20.04+ recommended) with at least 2GB RAM, 20GB storage
- **Domain**: Custom domain name (optional but recommended)
- **Docker**: Version 20.10+ and Docker Compose
- **Root Access**: For installing packages and configuring SSL

### One-Click Deployment

```bash
# Clone the repository
git clone <your-repo-url>
cd Sensei

# Run the deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 📋 Detailed Setup

### 1. Server Preparation

**Update System:**
```bash
sudo apt update && sudo apt upgrade -y
```

**Install Docker:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Configuration Setup

**Configure Environment:**
```bash
# Copy environment template
cp .env.production .env

# Edit configuration
nano .env
```

**Required Environment Variables:**
```bash
# Database
POSTGRES_PASSWORD=your_secure_password_here
REDIS_PASSWORD=your_secure_redis_password

# Security
JWT_SECRET=your_very_secure_32_character_jwt_secret
FRONTEND_URL=https://yourdomain.com

# Optional (for advanced features)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Deploy the Application

**Run Deployment Script:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**What the script does:**
- ✅ Creates necessary directories
- ✅ Generates self-signed SSL certificates
- ✅ Builds and starts all containers
- ✅ Runs database migrations
- ✅ Sets up proper permissions
- ✅ Verifies deployment health

### 4. SSL Certificate Setup (Recommended)

**For Production SSL:**
```bash
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com
```

**Manual SSL Setup:**
1. Get certificates from Let's Encrypt or your provider
2. Place files in `nginx/ssl/`:
   - `fullchain.pem`
   - `privkey.pem`
3. Update `nginx/conf.d/default.conf` with your domain
4. Restart Nginx: `docker-compose restart nginx`

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                    Internet                         │
└─────────────────────┬───────────────────────────┘
                      │
              ┌─────────▼─────────┐
              │    Nginx (80/443) │ ← SSL Termination
              └─────────┬─────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼─────┐ ┌─────▼─────┐ ┌───▼──────┐
   │ Frontend │ │  Backend  │ │ PostgreSQL│
   │  (React)  │ │  (Node.js)│ │ Database  │
   └───────────┘ └───────────┘ └───────────┘
                      │
              ┌─────▼─────┐
              │    Redis   │ ← Caching/Sessions
              └───────────┘
```

## 📁 Directory Structure

```
Sensei/
├── frontend/              # React frontend application
│   ├── src/
│   ├── Dockerfile.prod     # Production Dockerfile
│   └── nginx.conf          # Nginx configuration
├── backend/               # Node.js backend API
│   ├── src/
│   ├── Dockerfile.prod     # Production Dockerfile
│   └── prisma/             # Database schema
├── nginx/                  # Reverse proxy configuration
│   ├── nginx.conf          # Main Nginx config
│   ├── conf.d/             # Site configurations
│   └── ssl/                # SSL certificates
├── postgres/               # Database initialization
│   └── init/               # Startup scripts
├── scripts/                # Management scripts
│   ├── deploy.sh           # Main deployment script
│   ├── backup.sh           # Database backup
│   ├── restore.sh          # Database restore
│   └── setup-ssl.sh        # SSL certificate setup
├── docker-compose.prod.yml # Production services
└── .env                    # Environment variables
```

## 🔧 Management Commands

### Basic Operations

**Start Services:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Stop Services:**
```bash
docker-compose -f docker-compose.prod.yml down
```

**View Logs:**
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

**Restart Services:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

**Update Application:**
```bash
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Management

**Create Backup:**
```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec -T backup /backup.sh

# Automatic backup (runs daily)
docker-compose -f docker-compose.prod.yml exec -T backup /backup.sh
```

**Restore Backup:**
```bash
docker-compose -f docker-compose.prod.yml exec -T backup /restore.sh /backups/backup_file.sql.gz
```

**Access Database:**
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U sensei_user -d sensei_db
```

### SSL Management

**Check Certificate Status:**
```bash
openssl x509 -in nginx/ssl/fullchain.pem -text -noout | grep -E "(Subject:|Not Before:|Not After:)"
```

**Renew Certificates:**
```bash
sudo certbot renew
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🔒 Security Considerations

### Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH (port 22)
sudo ufw allow ssh

# Allow HTTP/HTTPS (ports 80/443)
sudo ufw allow 80
sudo ufw allow 443

# Check status
sudo ufw status
```

### Security Best Practices

1. **Strong Passwords**: Use unique, complex passwords for all services
2. **Regular Updates**: Keep system and Docker images updated
3. **SSL Certificates**: Use proper SSL certificates (not self-signed)
4. **Backups**: Regular database backups with offsite storage
5. **Monitoring**: Monitor logs and service health
6. **Network Security**: Configure firewall appropriately

### Environment Security

```bash
# Set proper file permissions
chmod 600 .env
chmod 700 scripts/
chmod 600 nginx/ssl/*.pem

# Secure Docker daemon
sudo nano /etc/docker/daemon.json
# Add: { "live-restore": true, "userland-proxy": false }
```

## 📊 Monitoring and Maintenance

### Health Checks

**Application Health:**
```bash
curl https://yourdomain.com/health
```

**Database Health:**
```bash
docker-compose exec postgres pg_isready -U sensei_user -d sensei_db
```

**Container Status:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Log Management

**View Application Logs:**
```bash
# Backend logs
docker-compose logs -f backend

# Nginx access logs
docker-compose exec nginx tail -f /var/log/nginx/access.log

# Database logs
docker-compose logs -f postgres
```

**Log Rotation:**
```bash
# Configure log rotation for nginx
sudo nano /etc/logrotate.d/nginx-sensei
```

### Performance Monitoring

**Resource Usage:**
```bash
# Docker stats
docker stats

# System resources
htop
```

**Database Performance:**
```bash
# Connect to database
docker-compose exec postgres psql -U sensei_user -d sensei_db

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('sensei_db'));
```

## 🔧 Troubleshooting

### Common Issues

**Container Won't Start:**
```bash
# Check logs
docker-compose logs service_name

# Check resource usage
docker stats

# Rebuild container
docker-compose up -d --force-recreate service_name
```

**Database Connection Issues:**
```bash
# Check if database is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres pg_isready -U sensei_user -d sensei_db

# Check network
docker network ls
docker network inspect sensei_sensei-network
```

**SSL Certificate Issues:**
```bash
# Verify certificate files exist
ls -la nginx/ssl/

# Check certificate validity
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Test SSL configuration
nginx -t
```

**Performance Issues:**
```bash
# Check resource usage
docker stats
free -h
df -h

# Optimize database
docker-compose exec postgres psql -U sensei_user -d sensei_db -c "VACUUM ANALYZE;"
```

### Recovery Procedures

**Complete Reset:**
```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down -v

# Remove all volumes (WARNING: deletes all data)
docker volume rm sensei_postgres_data sensei_redis_data

# Redeploy
./scripts/deploy.sh
```

**Application Reset:**
```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Reset database
docker volume rm sensei_postgres_data

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec -T backend npx prisma db push
```

## 📱 Scaling Considerations

### Vertical Scaling

**Increase Resources:**
- More RAM for database caching
- More CPU for animation generation
- More storage for user content

**Optimization:**
- Enable Redis caching
- Use CDN for static assets
- Optimize database queries

### Horizontal Scaling

**Load Balancing:**
```nginx
# Add multiple backend instances
upstream backend {
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}
```

**Database Replication:**
- Set up read replicas
- Use connection pooling
- Implement database sharding

## 📋 Backup Strategy

### Automated Backups

**Daily Database Backups:**
```bash
# Already configured in docker-compose.prod.yml
# Backups stored in postgres_backups volume
# Retention: 30 days (configurable)
```

**Configuration Backups:**
```bash
# Backup configuration files
tar -czf sensei-config-$(date +%Y%m%d).tar.gz .env nginx/ scripts/
```

**Full Application Backup:**
```bash
# Backup entire application
docker-compose -f docker-compose.prod.yml down
tar -czf sensei-backup-$(date +%Y%m%d).tar.gz .
```

### Disaster Recovery

**Recovery Process:**
1. Restore configuration files
2. Deploy application: `./scripts/deploy.sh`
3. Restore database: `./scripts/restore.sh backup_file.sql.gz`
4. Verify functionality
5. Update DNS if needed

## 🌐 Domain Configuration

### DNS Setup

**A Records:**
```
@         IN A    YOUR_SERVER_IP
www       IN A    YOUR_SERVER_IP
api       IN A    YOUR_SERVER_IP
```

**CNAME Records (optional):**
```
app       IN CNAME yourdomain.com.
```

### Email Configuration

**MX Records (optional):**
```
@         IN MX 10 mail.yourdomain.com.
```

## 📞 Support

**Getting Help:**
1. Check logs: `docker-compose logs -f`
2. Review this documentation
3. Check GitHub Issues
4. Create new issue with details

**Information to Include:**
- Server specifications
- Docker version
- Error messages from logs
- Steps to reproduce issue

---

**Your Sensei platform is now self-hosted and ready for students! 🎓✨**

Students can create visual stories, teachers can manage content, and everyone can enjoy the educational animations you've deployed on your own infrastructure.