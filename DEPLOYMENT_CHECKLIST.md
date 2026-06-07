# Hospital Management System - Deployment Checklist v12.0

## 🚀 Pre-Deployment Checklist

### Security Review

- [ ] All environment variables are set securely

- [ ] SESSION_SECRET is at least 32 characters

- [ ] JWT_SECRET is at least 32 characters

- [ ] Database password is strong (12+ chars, mixed case, numbers, symbols)

- [ ] Redis password is set (if exposed to network)

- [ ] ADMIN_IPS are correctly configured

- [ ] CORS origins are whitelisted (no wildcards)

- [ ] SSL/TLS certificate is valid

- [ ] HTTPS is enforced

### Database

- [ ] Database is created

- [ ] Schema is migrated (schema-v5-production.sql)

- [ ] Indexes are created

- [ ] Database backups are configured

- [ ] Database user has minimal required permissions

- [ ] Audit logs table exists and is write-only

### Redis

- [ ] Redis is installed and running

- [ ] Redis password is set (if needed)

- [ ] Redis persistence is configured

- [ ] Redis backups are configured

- [ ] Redis memory limit is set appropriately

### Node.js & Dependencies

- [ ] Node.js version is 18+ (check with `node --version`)

- [ ] npm packages are installed (`npm install`)

- [ ] All dependencies are up to date

- [ ] No security vulnerabilities (`npm audit`)

- [ ] package.json has correct version

### Code Quality

- [ ] All tests pass (`npm test`)

- [ ] Linting passes (`npm run lint`)

- [ ] No console.log statements in production code

- [ ] Error handling is comprehensive

- [ ] Logging is configured correctly

- [ ] No hardcoded secrets in code

### Configuration

- [ ] .env file is created and filled

- [ ] .env file is NOT committed to git

- [ ] .gitignore includes .env

- [ ] NODE_ENV is set to "production"

- [ ] LOG_LEVEL is set to "info" or "warn"

- [ ] PORT is set correctly

### Monitoring & Logging

- [ ] Logging is configured (Winston)

- [ ] Log files are writable

- [ ] Log rotation is configured

- [ ] Error tracking is set up (optional: Sentry)

- [ ] Performance monitoring is set up (optional)

- [ ] Health check endpoint is working

### API Documentation

- [ ] API documentation is generated

- [ ] Endpoints are documented

- [ ] Error codes are documented

- [ ] Rate limits are documented

- [ ] Authentication flow is documented

---

## 🔧 Deployment Steps

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Redis
sudo apt install -y redis-server

# Install MySQL
sudo apt install -y mysql-server

# Create app directory
sudo mkdir -p /var/www/hospital-api
sudo chown $USER:$USER /var/www/hospital-api
```

### Step 2: Clone & Setup Code

```bash
cd /var/www/hospital-api
git clone https://github.com/yourusername/hospital-management-system.git .
npm install --production
```

### Step 3: Configure Environment

```bash
# Copy and edit environment file
cp .env.example .env
nano .env  # Edit with your values
```

### Step 4: Setup Database

```bash
# Create database and tables
mysql -u root -p < database/schema-v5-production.sql

# Verify tables
mysql -u root -p hospital_management -e "SHOW TABLES;"
```

### Step 5: Start Services

```bash
# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Start Node.js app (using PM2 )
npm install -g pm2
pm2 start backend/server.js --name "hospital-api"
pm2 save
pm2 startup
```

### Step 6: Configure Nginx (Reverse Proxy)

```
# /etc/nginx/sites-available/hospital-api
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/hospital-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Setup SSL Certificate

```bash
# Using Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d api.yourdomain.com
```

### Step 8: Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 📊 Post-Deployment Verification

### Health Checks

```bash
# Check health endpoint
curl https://api.yourdomain.com/health

# Check logs
pm2 logs hospital-api

# Check processes
pm2 status
```

### Database Verification

```bash
# Test database connection
mysql -u root -p hospital_management -e "SELECT COUNT(* ) FROM users;"

# Check audit logs table
mysql -u root -p hospital_management -e "SELECT COUNT(*) FROM audit_logs;"
```

### Redis Verification

```bash
# Test Redis connection
redis-cli ping

# Check memory usage
redis-cli info memory
```

### Performance Testing

```bash
# Test API response time
time curl https://api.yourdomain.com/health

# Load test (optional )
npm run test:load
```

---

## 🔒 Security Hardening

### Server Hardening

```bash
# Disable root login
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password authentication
sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Restart SSH
sudo systemctl restart sshd
```

### Database Security

```bash
# Remove anonymous users
mysql -u root -p -e "DELETE FROM mysql.user WHERE User='';"

# Remove remote root login
mysql -u root -p -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"

# Flush privileges
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

### Application Security

```bash
# Set correct file permissions
chmod 600 .env
chmod 755 backend/
chmod 644 backend/*.js

# Disable directory listing
sudo sed -i 's/autoindex on;/autoindex off;/' /etc/nginx/nginx.conf
```

---

## 📈 Monitoring & Maintenance

### Daily Tasks

- [ ] Check application logs

- [ ] Monitor error rates

- [ ] Check database performance

- [ ] Verify backups completed

### Weekly Tasks

- [ ] Review security logs

- [ ] Check disk space

- [ ] Review rate limit statistics

- [ ] Check failed login attempts

### Monthly Tasks

- [ ] Update dependencies (`npm update`)

- [ ] Review audit logs

- [ ] Database optimization

- [ ] Security patches

### Quarterly Tasks

- [ ] Full security audit

- [ ] Performance optimization

- [ ] Disaster recovery testing

- [ ] Capacity planning

---

## 🆘 Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs hospital-api

# Check port is available
lsof -i :5000

# Check environment variables
cat .env | grep -E "^[A-Z]"
```

### Database Connection Error

```bash
# Test MySQL connection
mysql -u root -p -e "SELECT 1;"

# Check MySQL is running
sudo systemctl status mysql

# Check connection string in .env
grep DB_ .env
```

### Redis Connection Error

```bash
# Test Redis connection
redis-cli ping

# Check Redis is running
sudo systemctl status redis-server

# Check Redis config
grep port /etc/redis/redis.conf
```

### High Memory Usage

```bash
# Check Node.js memory
ps aux | grep node

# Check Redis memory
redis-cli info memory

# Restart if needed
pm2 restart hospital-api
```

---

## 📋 Rollback Plan

If deployment fails:

```bash
# Stop current version
pm2 stop hospital-api

# Revert code
git revert HEAD

# Reinstall dependencies
npm install --production

# Start previous version
pm2 start hospital-api

# Check logs
pm2 logs hospital-api
```

---

## ✅ Final Verification

- [ ] Application is running

- [ ] All endpoints are responding

- [ ] Database is accessible

- [ ] Redis is accessible

- [ ] Logs are being written

- [ ] SSL certificate is valid

- [ ] Rate limiting is working

- [ ] Admin IP whitelist is working

- [ ] Audit logs are being recorded

- [ ] Backups are scheduled

---

**Deployment Complete! Your Hospital Management System v12.0 is now live.** 🏥✨

For issues or questions, refer to:

- PRODUCTION_GUIDE_V12_FINAL_9_5_10.md

- ARCHITECTURE_GUIDE_V10_MONOLITHIC.md

- PROJECT_STRUCTURE_V12_COMPLETE.md

