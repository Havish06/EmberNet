# Path Configuration Guide

All documentation now uses **generic paths** instead of hard-coded file locations. This allows users on any operating system and any file location to use the project.

## Generic Path Notation

### What You'll See in Documentation

```bash
cd /path/to/EmberNet
npm run dev
```

### What You Should Replace

Replace `/path/to/EmberNet` with your **actual project directory path**.

---

## Examples by Operating System

### Windows

**If your project is at:** `C:\Users\YourName\Downloads\EmberNet`

```bash
cd C:\Users\YourName\Downloads\EmberNet
npm run dev
```

**If your project is at:** `C:\Users\YourName\Documents\Projects\EmberNet`

```bash
cd C:\Users\YourName\Documents\Projects\EmberNet
npm run dev
```

**If your project is at:** `D:\MyProjects\EmberNet`

```bash
cd D:\MyProjects\EmberNet
npm run dev
```

### macOS / Linux

**If your project is at:** `/Users/yourname/Projects/EmberNet`

```bash
cd /Users/yourname/Projects/EmberNet
npm run dev
```

**If your project is at:** `~/projects/EmberNet` (home directory shortcut)

```bash
cd ~/projects/EmberNet
npm run dev
```

**If your project is at:** `/home/username/development/EmberNet`

```bash
cd /home/username/development/EmberNet
npm run dev
```

---

## Quick Find Your Path

### Windows PowerShell
```powershell
# Get current directory
pwd

# Or with absolute path
Get-Location -UnmanagedPath
```

### macOS / Linux Terminal
```bash
# Get current directory
pwd

# Get home directory
echo ~
```

---

## All Generic Paths in Documentation

| Documentation | Generic Path | What to Replace |
|---------------|--------------|-----------------|
| **QUICKSTART.md** | `/path/to/EmberNet` | Your actual EmberNet directory |
| **ARCHITECTURE_MIGRATION.md** | `/path/to/EmberNet` | Your actual EmberNet directory |
| **IMPLEMENTATION_SUMMARY.md** | `/path/to/EmberNet` | Your actual EmberNet directory |
| **PHASE1_COMPLETION.md** | `/path/to/EmberNet` | Your actual EmberNet directory |
| **README_QUICKREF.md** | `/path/to/EmberNet` | Your actual EmberNet directory |

---

## Environment Variables

If documentation mentions setting environment variables, use generic paths:

### Generic Notation
```bash
# In documentation
NEXT_PUBLIC_API_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

### What Actually Goes in `.env.local`
```env
# Windows, macOS, and Linux all use:
NEXT_PUBLIC_API_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

> **Note:** Environment variables use URLs and ports, not file paths, so they're the same across all systems.

---

## Common Setup Patterns

### Pattern 1: Using Absolute Path

If your project is at `C:\Projects\EmberNet`:

```bash
cd C:\Projects\EmberNet
npm install
npm run dev
```

### Pattern 2: Using Relative Path (from parent directory)

If you're in `C:\Projects`:

```bash
cd EmberNet
npm install
npm run dev
```

### Pattern 3: Using Environment Variable

Set up a shell alias or environment variable:

```bash
# Windows (PowerShell)
$EMBERNET_HOME = "C:\Users\YourName\Downloads\EmberNet"
cd $EMBERNET_HOME
npm run dev

# macOS/Linux (Bash)
export EMBERNET_HOME=~/projects/EmberNet
cd $EMBERNET_HOME
npm run dev
```

---

## Docker & Container Paths

When using Docker, mount paths vary by system:

### Windows Docker Desktop
```bash
docker run -v C:\Users\YourName\EmberNet:/app -p 6379:6379 redis:latest
```

### macOS / Linux
```bash
docker run -v ~/projects/EmberNet:/app -p 6379:6379 redis:latest
```

---

## Troubleshooting Path Issues

### Error: "Cannot find directory"
1. Check spelling: `cd /path/to/EmberNet`
2. Verify folder exists: `ls` or `dir` command
3. Use `pwd` to confirm current location
4. Use absolute path instead of relative path

### Error: "No such file or directory" on Windows
- Use forward slashes: `C:/Users/Name/EmberNet` (also works on Windows PowerShell)
- Or backslashes: `C:\Users\Name\EmberNet`
- Not mixed: `C:/Users\Name\EmberNet` (may fail)

### Error: Permission Denied (macOS/Linux)
```bash
# Ensure you have directory permissions
ls -la /path/to/EmberNet

# If needed, change permissions
chmod 755 /path/to/EmberNet
```

---

## Starting the Dev Server from Anywhere

### Quick Start Template

**For Windows:**
```batch
@echo off
cd /d C:\Your\Project\Path\EmberNet
npm run dev
pause
```

Save as `start-dev.bat`, then double-click to start.

**For macOS/Linux:**
```bash
#!/bin/bash
cd ~/your/project/path/EmberNet
npm run dev
```

Save as `start-dev.sh`, then:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

---

## Summary

✅ **All documentation is now location-agnostic**  
✅ **Use generic `/path/to/EmberNet` notation**  
✅ **Replace with your actual directory path**  
✅ **Works across Windows, macOS, and Linux**  

**Next Step:** Follow the generic paths in QUICKSTART.md with your actual project location!
