# EmberNet - Requirements & Setup Guide

## Quick Start

### 1. Install Node.js Dependencies

```bash
npm install
```

This will install all required packages from `package.json` including:
- Redis client (`redis@^4.6.12`)
- Socket.IO client (`socket.io-client@^4.7.2`)
- Encryption libraries (`tweetnacl@^1.0.3`)
- UI components (Radix UI, Tailwind CSS, etc.)

### 2. Install Redis

Redis is the **critical external dependency** for this project.

#### Option A: Docker (Easiest - Recommended)

```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop

# Start Redis container
docker run -d --name ember-redis -p 6379:6379 redis:latest

# Verify it's running
docker ps | findstr ember-redis
```

#### Option B: Windows Subsystem for Linux (WSL2)

```bash
# Install WSL2 and Ubuntu: https://learn.microsoft.com/en-us/windows/wsl/install

# Inside WSL2:
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
redis-server

# In another terminal, verify:
redis-cli ping
# Output: PONG
```

#### Option C: Windows Native (Using Memurai)

1. **Download:** https://www.memurai.com/
2. **Install:** Run the installer and follow prompts
3. **Verify:** Open PowerShell

```powershell
# Should work now
redis-cli ping
# Output: PONG
```

#### Option D: Windows Native (Manual Setup)

1. Download: https://github.com/microsoftarchive/redis/releases
2. Extract to `C:\redis`
3. Run `redis-server.exe`

### 3. Create Environment File

Create `.env.local` in the project root:

```env
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Start Development Server

```bash
npm run dev
```

Open browser: `http://localhost:3000`

---

## Complete Dependency List

### Node.js Packages (auto-installed via `npm install`)

```
Frontend Framework:
  ✅ next@16.2.6
  ✅ react@19.2.4
  ✅ react-dom@19.2.4

UI Components:
  ✅ @radix-ui/* (40+ components)
  ✅ lucide-react@0.564.0
  ✅ tailwindcss@4.2.0

Real-time Communication:
  ✅ socket.io-client@4.7.2
  ✅ redis@4.6.12

Security & Encryption:
  ✅ tweetnacl@1.0.3
  ✅ crypto-js@4.2.0

State Management:
  ✅ zustand@5.0.13

Routing & Forms:
  ✅ react-hook-form@7.54.1
  ✅ zod@3.24.1

Data Visualization:
  ✅ recharts@2.15.0
  ✅ @xyflow/react@12.10.2

Utilities:
  ✅ framer-motion@12.40.0
  ✅ date-fns@4.1.0
  ✅ clsx@2.1.1

Development:
  ✅ typescript@5.7.3
  ✅ tailwindcss@4.2.0
  ✅ postcss@8.5
```

### External Service Requirements

| Service | Purpose | Installation | Check |
|---------|---------|--------------|-------|
| **Redis** | Real-time state, Pub/Sub | See above | `redis-cli ping` |
| **Node.js** | Runtime | https://nodejs.org | `node --version` |

---

## Installation Troubleshooting

### Problem: `npm install` fails

**Solution:**
```bash
# Clear cache
npm cache clean --force

# Reinstall
npm install
```

### Problem: `redis-cli` not recognized (Windows)

**This is normal!** `redis-cli` is optional for development if Redis is running elsewhere.

**Solutions in order:**

1. **Check if Redis is running anyway:**
   ```bash
   netstat -an | findstr :6379
   ```
   If you see `LISTENING`, Redis is running! You can proceed.

2. **Use Docker (Easiest):**
   ```bash
   docker run -d -p 6379:6379 redis:latest
   ```

3. **Install Memurai (Windows-native):**
   - Download: https://www.memurai.com/
   - Run installer
   - Restart terminal

4. **Use WSL2:**
   - Install WSL2
   - Run Redis inside WSL2 Ubuntu
   - Keep WSL terminal open

### Problem: Port 6379 already in use

```bash
# Find what's using port 6379
netstat -ano | findstr :6379

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F

# Or if it's Docker:
docker ps | findstr redis
docker stop <container_id>
```

### Problem: `npm run dev` fails to connect to Redis

```bash
# 1. Verify .env.local has REDIS_URL
cat .env.local
# Should contain: REDIS_URL=redis://localhost:6379

# 2. Verify Redis is running
redis-cli ping
# Should return: PONG
# Or check: netstat -an | findstr :6379

# 3. Verify port 3000 is free
netstat -ano | findstr :3000

# 4. Try dev again
npm run dev
```

### Problem: Connection refused when starting app

**This means Redis is not running!**

**Fix:**
```bash
# Option 1: Docker
docker run -d -p 6379:6379 redis:latest

# Option 2: Memurai (Windows)
# Should auto-start after installation

# Option 3: Manual (Linux/macOS)
redis-server
```

Keep Redis running in a separate terminal while dev server is running.

---

## Verification Checklist

Before starting development, verify:

```bash
# 1. Node.js installed
node --version
# Expected: v18.x or higher

# 2. npm installed
npm --version
# Expected: v9.x or higher

# 3. Dependencies installed
npm list redis socket.io-client
# Should show both packages

# 4. Redis accessible (pick one)
redis-cli ping
# OR
docker ps | findstr redis
# OR check http://localhost:6379 connectivity

# 5. Dev server starts
npm run dev
# Should see: "started server on 0.0.0.0:3000"
```

---

## Development Workflow

### Daily Startup

```bash
# Terminal 1: Start Redis (if not using Docker)
redis-server

# Terminal 2: Start dev server
npm run dev

# Terminal 3 (optional): Watch logs
npm run dev -- --debug
```

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## Docker Setup (Complete Alternative)

If you prefer containerized development:

### 1. Install Docker Desktop
https://www.docker.com/products/docker-desktop

### 2. Start Services

```bash
# Start Redis
docker run -d --name ember-redis -p 6379:6379 redis:latest

# Optionally: Start in Docker too
# (Requires Dockerfile - not included yet)
```

### 3. Verify

```bash
docker ps
# Should show: ember-redis container running
```

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 2GB | 8GB |
| **Disk** | 500MB | 2GB |
| **Node.js** | 16.x | 20.x+ |
| **npm** | 8.x | 10.x+ |
| **Redis** | 6.x | 7.x+ |

---

## Next Steps

1. **Install dependencies:** `npm install`
2. **Install Redis:** Choose one option from "Install Redis" section
3. **Create .env.local** with Redis URL
4. **Start dev server:** `npm run dev`
5. **Access application:** http://localhost:3000
6. **Read:** `QUICKSTART.md` for usage guide

---

## Support Resources

- **Next.js:** https://nextjs.org/docs
- **Redis:** https://redis.io/docs/getting-started/
- **React:** https://react.dev
- **Socket.IO:** https://socket.io/docs/v4/

---

## Troubleshooting Priority

1. **Redis not running?** → Start Redis (Docker or native)
2. **Dependencies missing?** → Run `npm install`
3. **Port 3000 in use?** → Change in `next.config.mjs`
4. **Still broken?** → Check `.env.local` has `REDIS_URL`

Good luck! 🚀
