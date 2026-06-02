# Windows Setup Guide - EmberNet

## Quick Start (Windows)

### Step 1: Install Node.js

1. Go to: https://nodejs.org/
2. Download **LTS version** (recommended)
3. Run installer, click "Next" through all steps
4. **Restart your computer** after installation
5. Verify in PowerShell:

```powershell
node --version  # Should show v18.x or higher
npm --version   # Should show v9.x or higher
```

---

### Step 2: Install Dependencies

Open PowerShell **as Administrator** in your EmberNet folder:

```powershell
cd /path/to/EmberNet  # Replace with your path
npm install
```

This will download and install all required packages (~500MB).

---

### Step 3: Install Redis

**Choose ONE option:**

#### Option A: Docker (Easiest) ✅ RECOMMENDED

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
2. Open PowerShell:

```powershell
docker run -d --name ember-redis -p 6379:6379 redis:latest
```

3. Verify:
```powershell
docker ps
# Should show: ember-redis running
```

#### Option B: Memurai (Windows-Native) ✅ RECOMMENDED

1. Download: https://www.memurai.com/
2. Run installer (double-click `.msi` file)
3. Follow installation wizard
4. **Restart PowerShell** after installation
5. Verify:

```powershell
redis-cli ping
# Should show: PONG
```

#### Option C: Windows Subsystem for Linux (WSL2)

1. Install WSL2: Open PowerShell as Admin:
```powershell
wsl --install
# Restart computer
```

2. Open Ubuntu terminal and run:
```bash
sudo apt-get update
sudo apt-get install redis-server
redis-server
```

3. Keep this terminal running (it's the Redis server)

#### Option D: Manual Installation (Advanced)

1. Download: https://github.com/microsoftarchive/redis/releases
2. Extract to: `C:\redis`
3. Open `C:\redis\` in PowerShell:

```powershell
cd C:\redis
.\redis-server.exe
```

Keep this terminal running (it's the Redis server).

---

### Step 4: Create Environment File

In your EmberNet folder, create a file named `.env.local`:

**Using Notepad:**
1. Open Notepad
2. Paste this content:

```env
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

3. Save as `.env.local` (File → Save As → Type ".*" → Save)

**Using PowerShell:**
```powershell
@"
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
"@ | Out-File -Encoding UTF8 -Path .env.local
```

---

### Step 5: Run the Application

Open **2 PowerShell windows** in your EmberNet folder:

**Terminal 1 - Start Redis:**
```powershell
# If using Docker (skip if Memurai)
docker start ember-redis
# Or if Memurai/native, it should auto-start
```

**Terminal 2 - Start Dev Server:**
```powershell
npm run dev
```

Wait for message: `Ready in XXXms`

---

### Step 6: Access the Application

Open your browser:
- **User Dashboard:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin

---

## Common Windows Issues & Solutions

### Issue: `redis-cli` not recognized

**Cause:** Redis not installed

**Solution:**
```powershell
# Option 1: Use Docker (safest)
docker run -d --name ember-redis -p 6379:6379 redis:latest

# Option 2: Install Memurai from https://www.memurai.com/

# Option 3: Check if Redis is running anyway
netstat -ano | findstr :6379
# If you see LISTENING, Redis is running
```

### Issue: `npm install` fails

**Cause:** Network issue or corrupted cache

**Solution:**
```powershell
npm cache clean --force
npm install
```

### Issue: Port 3000 already in use

**Cause:** Another app is using port 3000

**Solution:**
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill that process (replace PID with the number shown)
taskkill /PID 1234 /F

# Try npm run dev again
npm run dev
```

### Issue: `.env.local` not created properly

**Cause:** File hidden or wrong format

**Solution:**
```powershell
# Delete old file
Remove-Item .env.local -Force

# Create new one with correct format
@"
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
"@ | Out-File -Encoding UTF8 -Path .env.local

# Verify it exists
Get-Content .env.local
```

### Issue: `npm run dev` fails to start

**Cause:** Redis not running or .env not set

**Solution:**
```powershell
# 1. Check Redis
redis-cli ping
# Should return: PONG

# 2. Check .env.local exists
Get-Content .env.local

# 3. Check ports available
netstat -ano | findstr :3000  # Should be empty
netstat -ano | findstr :6379  # Should show LISTENING

# 4. Try again
npm run dev
```

---

## Automated Setup Script

I've provided `setup-windows.bat` - **Just double-click it!**

```batch
C:\Users\YourName\Downloads\EmberNet\setup-windows.bat
```

This will automatically:
- ✅ Check Node.js and npm
- ✅ Install dependencies
- ✅ Check Redis
- ✅ Create .env.local

---

## Full Command Reference

### Start Development
```powershell
npm run dev
```

### Build for Production
```powershell
npm run build
npm start
```

### Run Linter
```powershell
npm run lint
```

### Check Everything
```powershell
node --version
npm --version
redis-cli ping
Get-Content .env.local
```

---

## System Requirements

| Component | Minimum | Check Command |
|-----------|---------|---------------|
| Windows | Windows 10+ | `wmic os get version` |
| Node.js | 16.x | `node --version` |
| npm | 8.x | `npm --version` |
| RAM | 2GB | Check Settings → System |
| Disk | 1GB free | Check C:\ drive |

---

## Next Steps

1. ✅ Follow Step 1-6 above
2. ✅ Run `npm run dev`
3. ✅ Open http://localhost:3000
4. ✅ Read `QUICKSTART.md` for usage
5. ✅ Check `REQUIREMENTS.md` for detailed info

---

## Need Help?

1. **Check REQUIREMENTS.md** - Complete dependency list
2. **Check QUICKSTART.md** - Full guide
3. **Check troubleshooting above** - Common issues
4. **Check PATH_CONFIGURATION_GUIDE.md** - Path issues

Good luck! 🚀

---

## What These Files Do

| File | Purpose |
|------|---------|
| `setup-windows.bat` | One-click setup (just double-click!) |
| `REQUIREMENTS.md` | Complete setup guide for all OS |
| `QUICKSTART.md` | How to use the application |
| `.env.local` | Configuration file (you create this) |
| `package.json` | Node.js dependencies |

---

## Firewall Notice

If Windows Firewall asks about Node.js or Redis:
- Click **"Allow Access"**
- Both need network access for WebSocket communication

---

## Tips & Tricks

**Keep dev server running:**
```powershell
# Instead of closing the terminal, minimize it
# Dev server keeps running in background
```

**Hot reload:**
```powershell
# Edit any .tsx, .ts, .css file
# Browser auto-refreshes (no restart needed)
```

**Clear cache if weird behavior:**
```powershell
rm -r .next
npm run dev
```

**Update dependencies safely:**
```powershell
npm outdated          # See what's old
npm update            # Update everything
npm audit             # Check for security issues
```

---

**Happy coding!** 🎉
