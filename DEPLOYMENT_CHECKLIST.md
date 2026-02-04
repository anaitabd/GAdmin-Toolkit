# Deployment Checklist

## ✅ Pre-Deployment Verification

### Environment Setup
- [x] `.env` file created with secure secrets
- [x] JWT_SECRET generated (32+ characters)
- [x] ENCRYPTION_KEY generated (32 characters)
- [x] TRACKING_SECRET generated (32+ characters)
- [x] DB_PASSWORD set

### Database
- [x] PostgreSQL 15 container running
- [x] All migrations applied (21 tables)
- [x] admin_users table exists
- [x] Default admin user created

### Services
- [x] PostgreSQL running on port 5432
- [x] Redis running on port 6379
- [x] API server starts successfully

### Testing
- [x] Health endpoint responds
- [x] Authentication endpoint works
- [x] JWT tokens generated successfully
- [x] Database connections established

## 🔐 Security Checklist

### Immediate Actions Required
- [ ] Change default admin password (admin/admin123)
- [ ] Rotate all generated secrets
- [ ] Review and update AWS credentials
- [ ] Enable SSL/TLS in production
- [ ] Configure firewall rules

### Recommended Actions
- [ ] Set up regular database backups
- [ ] Configure monitoring and alerting
- [ ] Review and update security policies
- [ ] Set up log rotation
- [ ] Configure rate limiting appropriately

## 📝 Quick Commands

### Start Everything
```bash
./start.sh
```

### Check Service Status
```bash
docker compose ps
```

### View Logs
```bash
# API logs
tail -f logs/combined.log

# Database logs
docker compose logs postgres

# All service logs
docker compose logs -f
```

### Test Authentication
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Create New Admin User
```bash
# Generate password hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_PASSWORD', 10, (err, hash) => { console.log(hash); });"

# Insert into database
docker exec -it gadmin-postgres psql -U gadmin -d gadmin_toolkit
INSERT INTO admin_users (username, password_hash, role) VALUES ('newadmin', 'HASH_HERE', 'admin');
```

## 🚀 Production Deployment

### Before Going Live
1. Review all environment variables
2. Change default passwords
3. Enable SSL/TLS
4. Configure domain names
5. Set up monitoring
6. Test all endpoints
7. Review security settings
8. Configure backups
9. Set up log management
10. Document runbook procedures

### AWS Configuration (Optional)
If using AWS features:
- [ ] Configure AWS credentials
- [ ] Set security group ID
- [ ] Configure key pair
- [ ] Set Route53 hosted zone ID
- [ ] Configure tracking domain

## 📊 Monitoring

### Health Checks
- API: http://localhost:3000/health
- Database: `docker exec gadmin-postgres pg_isready -U gadmin`
- Redis: `docker exec gadmin-redis redis-cli ping`

### Key Metrics to Monitor
- API response times
- Database connection pool usage
- Queue depths
- Error rates
- Disk usage
- Memory usage

## 🆘 Troubleshooting

### Server Won't Start
1. Check logs directory exists: `mkdir -p logs`
2. Verify .env file is present
3. Check database is running: `docker compose ps`
4. Review logs: `tail -f logs/error.log`

### Database Connection Failed
1. Check PostgreSQL is running: `docker compose ps postgres`
2. Verify credentials in .env
3. Test connection: `docker exec gadmin-postgres psql -U gadmin -d gadmin_toolkit`

### Authentication Not Working
1. Verify admin_users table exists
2. Check admin user was created
3. Verify JWT_SECRET is set
4. Check application logs

## 📚 Additional Resources

- [GETTING_STARTED.md](./GETTING_STARTED.md) - Quick start guide
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [SECURITY.md](./SECURITY.md) - Security guidelines
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Current status

## ✅ Deployment Complete

Once all checklist items are complete:
1. Document any deviations from standard setup
2. Share credentials securely with team
3. Set up monitoring alerts
4. Schedule first backup
5. Begin frontend development or go live!
