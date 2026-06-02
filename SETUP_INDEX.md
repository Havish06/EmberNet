# EmberNet Setup Documentation Index

## 🚀 Quick Links by Operating System

### Windows Users 🪟
Start here: **[WINDOWS_SETUP.md](WINDOWS_SETUP.md)**

Or just double-click: **`setup-windows.bat`**

### macOS/Linux Users 🐧
```bash
chmod +x setup.sh
./setup.sh
```

### Everyone Else
Read: **[REQUIREMENTS.md](REQUIREMENTS.md)**

---

## 📚 Documentation Overview

### For First-Time Setup

| Document | Best For | Read Time |
|----------|----------|-----------|
| **[WINDOWS_SETUP.md](WINDOWS_SETUP.md)** | Windows users | 10 min |
| **[REQUIREMENTS.md](REQUIREMENTS.md)** | All users, detailed | 15 min |
| **[QUICKSTART.md](QUICKSTART.md)** | After setup, usage | 10 min |
| **[PATH_CONFIGURATION_GUIDE.md](PATH_CONFIGURATION_GUIDE.md)** | Path issues | 5 min |

### For Architecture & Development

| Document | Best For | Read Time |
|----------|----------|-----------|
| **[ARCHITECTURE_MIGRATION.md](ARCHITECTURE_MIGRATION.md)** | System overview | 15 min |
| **[BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md)** | Deep dive | 30 min |
| **[PHASE1_COMPLETION.md](PHASE1_COMPLETION.md)** | Phase 1 summary | 20 min |
| **[README_QUICKREF.md](README_QUICKREF.md)** | Quick reference | 5 min |

---

## ⚡ Setup Flow

```
START
  ↓
Are you on Windows?
  ├─ YES → Run setup-windows.bat → Done ✅
  ├─ NO → Is it macOS/Linux?
  │       ├─ YES → Run setup.sh → Done ✅
  │       ├─ NO → Read REQUIREMENTS.md → Done ✅
  └─ CONFUSED? → Read WINDOWS_SETUP.md
```

---

## 📦 What Gets Installed

### Node.js Packages (auto via npm install)
- ✅ Next.js 16.2.6
- ✅ React 19.2.4
- ✅ Redis client 4.6.12
- ✅ Socket.IO client 4.7.2
- ✅ Encryption: TweetNaCl
- ✅ UI: Radix UI + Tailwind CSS
- ✅ 50+ other packages

**Install:** `npm install`

### External Services (manual install)
- ✅ **Redis** (required for real-time sync)
  - Docker: `docker run -d -p 6379:6379 redis:latest`
  - Memurai: https://www.memurai.com/ (Windows)
  - Homebrew: `brew install redis` (macOS)
  - Linux: `sudo apt-get install redis-server`

---

## 🔍 Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| `redis-cli` not found | [WINDOWS_SETUP.md - Issue: redis-cli not recognized](WINDOWS_SETUP.md#issue-redis-cli-not-recognized) |
| `npm install` fails | [WINDOWS_SETUP.md - Issue: npm install fails](WINDOWS_SETUP.md#issue-npm-install-fails) |
| Port 3000 already used | [WINDOWS_SETUP.md - Issue: Port 3000 already in use](WINDOWS_SETUP.md#issue-port-3000-already-in-use) |
| Redis won't start | [REQUIREMENTS.md - Troubleshooting](REQUIREMENTS.md#problem-redis-not-running-windows) |
| Path issues | [PATH_CONFIGURATION_GUIDE.md](PATH_CONFIGURATION_GUIDE.md) |

---

## 📋 Setup Scripts Provided

### Windows
```batch
setup-windows.bat          <- Just double-click this!
```

**What it does:**
- ✅ Checks Node.js
- ✅ Checks npm
- ✅ Installs dependencies
- ✅ Checks Redis
- ✅ Creates .env.local

### macOS/Linux
```bash
setup.sh                   <- Run this
chmod +x setup.sh
./setup.sh
```

**What it does:**
- ✅ Checks Node.js
- ✅ Checks npm
- ✅ Installs dependencies
- ✅ Checks redis-cli
- ✅ Creates .env.local

---

## 🎯 Typical Setup Time

| OS | Time | Notes |
|----|------|-------|
| **Windows** | 20-30 min | Includes Node.js + Redis install |
| **macOS** | 10-15 min | Usually has Homebrew |
| **Linux** | 10-15 min | Usually has apt/yum |

**Just dependencies?** 2-3 minutes (only `npm install`)

---

## ✅ Verification Commands

After setup, verify everything works:

```bash
# Windows
node --version              # Should show v18+
npm --version               # Should show v9+
redis-cli ping              # Should show PONG
Get-Content .env.local      # Should show config
npm run dev                 # Should start on :3000

# macOS/Linux
node --version
npm --version
redis-cli ping
cat .env.local
npm run dev
```

---

## 🚨 Critical Checklist

- [ ] Node.js v18+ installed
- [ ] npm installed
- [ ] Redis installed & running
- [ ] `.env.local` created with REDIS_URL
- [ ] `npm install` completed
- [ ] `npm run dev` starts without errors
- [ ] Browser opens http://localhost:3000

---

## 📖 Reading Order Recommendation

### New to EmberNet?
1. **[WINDOWS_SETUP.md](WINDOWS_SETUP.md)** or **[REQUIREMENTS.md](REQUIREMENTS.md)** - Get it running
2. **[QUICKSTART.md](QUICKSTART.md)** - Understand the UI
3. **[README_QUICKREF.md](README_QUICKREF.md)** - Quick reference

### Want to understand architecture?
1. **[ARCHITECTURE_MIGRATION.md](ARCHITECTURE_MIGRATION.md)** - Big picture
2. **[BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md)** - Deep dive
3. **[PHASE1_COMPLETION.md](PHASE1_COMPLETION.md)** - What's done

### Troubleshooting?
1. Check the **Troubleshooting** section in [WINDOWS_SETUP.md](WINDOWS_SETUP.md)
2. Check the **Troubleshooting** section in [REQUIREMENTS.md](REQUIREMENTS.md)
3. Check [PATH_CONFIGURATION_GUIDE.md](PATH_CONFIGURATION_GUIDE.md)

---

## 🎨 File Structure

```
EmberNet/
├── setup-windows.bat              ← Windows: Just double-click!
├── setup.sh                       ← macOS/Linux: Run this
├── WINDOWS_SETUP.md               ← Windows users start here
├── REQUIREMENTS.md                ← Complete setup for all OS
├── QUICKSTART.md                  ← After setup, how to use
├── PATH_CONFIGURATION_GUIDE.md    ← Path/location issues
│
├── ARCHITECTURE_MIGRATION.md      ← Architecture overview
├── BACKEND_ARCHITECTURE.md        ← Deep architecture dive
├── PHASE1_COMPLETION.md           ← What's implemented
├── README_QUICKREF.md             ← Quick reference
│
├── package.json                   ← Node dependencies
├── .env.local                     ← YOU CREATE THIS
├── .gitignore
│
├── app/                           ← Next.js app
├── components/                    ← React components
├── lib/                          ← Utilities & services
├── styles/                       ← CSS
└── ...
```

---

## 🔐 Environment Variables

Create `.env.local` in root:

```env
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

**Where to put it:** `C:\Users\YourName\Downloads\EmberNet\.env.local`

---

## 🆘 Getting Help

1. **Setup issues?** → [WINDOWS_SETUP.md](WINDOWS_SETUP.md)
2. **Architecture questions?** → [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md)
3. **Path issues?** → [PATH_CONFIGURATION_GUIDE.md](PATH_CONFIGURATION_GUIDE.md)
4. **How to use?** → [QUICKSTART.md](QUICKSTART.md)
5. **Need checklist?** → [REQUIREMENTS.md](REQUIREMENTS.md)

---

## 🎉 You're Ready!

After following setup:

```bash
npm run dev
```

Open browser: http://localhost:3000

Welcome to EmberNet! 🚀

---

## Document Cheat Sheet

**Just want to START?**
```
→ Windows: setup-windows.bat
→ Mac/Linux: ./setup.sh
→ Manual: npm install, then REQUIREMENTS.md
```

**Just want to USE?**
```
→ npm run dev
→ Open http://localhost:3000
→ Read QUICKSTART.md
```

**Want to UNDERSTAND?**
```
→ ARCHITECTURE_MIGRATION.md (10 min overview)
→ BACKEND_ARCHITECTURE.md (30 min deep dive)
→ README_QUICKREF.md (5 min reference)
```

**Have a PROBLEM?**
```
→ Check WINDOWS_SETUP.md Troubleshooting
→ Check REQUIREMENTS.md Troubleshooting
→ Check PATH_CONFIGURATION_GUIDE.md
```

---

**Last updated:** 2026-05-31
