# P2PHub - Railway Deployment Guide

This guide covers deploying the P2PHub application to Railway.

## Architecture

- **Backend**: FastAPI + PostgreSQL
- **Frontend**: React (Vite) + Nginx
- **Database**: PostgreSQL (provisioned on Railway)
- **Redis**: Optional (for caching/sessions)

## Prerequisites

1. [Railway account](https://railway.app)
2. Railway CLI (optional): `npm i -g @railway/cli`
3. GitHub repository connected to Railway (recommended)

## Deployment Steps

### 1. Create New Railway Project

```bash
# Via Railway CLI
railway init

# Or use the Railway dashboard
```

### 2. Provision PostgreSQL Database

1. In Railway dashboard, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will automatically create a `DATABASE_URL` environment variable

### 3. Deploy Backend Service

#### Via Railway Dashboard:

1. Click **"New"** → **"GitHub Repo"** (or "Empty Service")
2. Select your repository
3. Configure the service:
   - **Name**: `p2phub-backend`
   - **Root Directory**: `/backend`
   - **Build Command**: Auto-detected (Dockerfile)
   - **Start Command**: Auto-detected

#### Environment Variables:

Add these in the Railway dashboard under **Variables**:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
BOT_TOKEN=your_telegram_bot_token_here
REDIS_URL=redis://your-redis-url (if using Redis)
PORT=${{PORT}}
```

> **Note**: `DATABASE_URL` and `PORT` are auto-provided by Railway. Use the variable reference syntax `${{Postgres.DATABASE_URL}}`.

### 4. Deploy Frontend Service

#### Via Railway Dashboard:

1. Click **"New"** → **"GitHub Repo"** (or use same repo)
2. Configure the service:
   - **Name**: `p2phub-frontend`
   - **Root Directory**: `/frontend`
   - **Build Command**: Auto-detected (Dockerfile)
   - **Start Command**: Auto-detected

#### Environment Variables:

```env
PORT=${{PORT}}
VITE_API_URL=https://p2phub-backend.up.railway.app
VITE_APP_ENV=production
```

> **Important**: Replace `p2phub-backend.up.railway.app` with your actual backend URL from Railway.

### 5. Run Database Migrations

After backend deployment, run migrations:

```bash
# Via Railway CLI
railway run -s p2phub-backend alembic upgrade head

# Or use the Railway dashboard terminal
```

## Environment Variables Reference

### Backend

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `BOT_TOKEN` | ✅ | Telegram bot token | `123456:ABC-DEF...` |
| `REDIS_URL` | ❌ | Redis connection string | `redis://localhost:6379/0` |
| `PORT` | ✅ | Server port (auto-provided) | `8000` |

### Frontend

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | ✅ | Backend API URL | `https://api.example.com` |
| `VITE_APP_ENV` | ❌ | Environment | `production` or `staging` |
| `PORT` | ✅ | Server port (auto-provided) | `80` |

## Verification

### Backend Health Check

```bash
curl https://your-backend-url.railway.app/health
# Expected: {"status":"healthy"}
```

### Frontend

Visit your frontend URL in a browser and verify:
- ✅ Page loads without errors
- ✅ Can connect to backend API
- ✅ No CORS errors in console

## Troubleshooting

### Build Failures

**Check Dockerfile syntax**:
```bash
# Test locally
docker build -t p2phub-backend ./backend
docker build -t p2phub-frontend ./frontend
```

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check if migrations have run
- Ensure PostgreSQL service is healthy

### CORS Errors

- Update `allow_origins` in `backend/app/main.py` with your frontend URL
- Verify `VITE_API_URL` points to the correct backend

### Port Binding Issues

- Ensure Dockerfiles use `${PORT:-8000}` syntax
- Check Railway logs for port errors

## Monitoring

Railway provides:
- **Logs**: Real-time logs for each service
- **Metrics**: CPU, memory, network usage
- **Deployments**: History of all deployments

Access via the Railway dashboard.

## Custom Domains

1. Go to service **Settings** → **Domains**
2. Click **"Generate Domain"** or add custom domain
3. Update `VITE_API_URL` in frontend if backend URL changes

## CI/CD

Railway auto-deploys on git push when connected to GitHub:

1. Push to `main` branch
2. Railway detects changes
3. Triggers build & deploy
4. Health checks verify deployment

## Costs

Railway offers:
- **Free tier**: $5 credit/month
- **Pro plan**: $20/month + usage

Monitor usage in Railway dashboard.

## Support

- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [P2PHub Issues](https://github.com/your-repo/issues)
