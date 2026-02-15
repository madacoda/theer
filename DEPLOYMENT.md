# Production Deployment Guide

## Prerequisites
- Docker & Docker Compose installed
- `.env.production` configured with production values

## Quick Start

### 1. Build and Start All Services
```bash
docker-compose up -d --build
```

### 2. Check Service Health
```bash
docker-compose ps
```

All services should show "healthy" status.

### 3. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f worker
```

### 4. Run Database Migrations
```bash
docker-compose exec api bunx prisma db push
```

### 5. Seed Database (Optional)
```bash
docker-compose exec api bun run seed
```

## Service URLs
- **API**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **PostgreSQL**: localhost:5432

## Production Deployment

### 1. Update Environment Variables
```bash
cp .env.production .env
# Edit .env with production values
```

### 2. Build Production Images
```bash
docker-compose build --no-cache
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Monitor Health
```bash
docker-compose ps
docker-compose logs -f
```

## Scaling Workers

To handle more AI processing load, scale the worker service:

```bash
docker-compose up -d --scale worker=3
```

## Backup & Restore

### Backup Database
```bash
docker-compose exec db pg_dump -U postgres mctheer > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker-compose exec -T db psql -U postgres mctheer
```

## Troubleshooting

### Check Service Health
```bash
docker-compose ps
docker inspect mctheer-api --format='{{.State.Health.Status}}'
```

### Restart Services
```bash
docker-compose restart api worker
```

### Clean Restart
```bash
docker-compose down
docker-compose up -d --build
```

### View Resource Usage
```bash
docker stats
```

## Security Checklist

- [ ] Change default passwords in `.env`
- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Restrict database ports (remove port mapping in production)
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

## Performance Tuning

### Database
- Adjust `deploy.resources` in docker-compose.yml
- Configure connection pooling in Prisma

### Worker
- Scale workers based on ticket volume
- Monitor RabbitMQ queue depth

### API
- Enable response caching
- Configure rate limiting
- Use CDN for static assets

## Monitoring

### Health Checks
All services have built-in health checks:
- Database: `pg_isready`
- RabbitMQ: `rabbitmq-diagnostics ping`
- API: HTTP endpoint check

### Logs
Logs are automatically rotated (max 10MB, 3 files per service)

```bash
# Follow all logs
docker-compose logs -f

# Filter by service
docker-compose logs -f worker | grep "AI Triage"
```

## Maintenance

### Update Dependencies
```bash
bun update
docker-compose build --no-cache
docker-compose up -d
```

### Prune Unused Resources
```bash
docker system prune -a
```

## Production Checklist

- [ ] `.env.production` configured
- [ ] Strong passwords set
- [ ] Database backed up
- [ ] Health checks passing
- [ ] Logs monitored
- [ ] Resource limits configured
- [ ] SSL/TLS enabled
- [ ] Firewall configured
- [ ] Monitoring alerts set up
