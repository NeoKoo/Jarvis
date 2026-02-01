# Zeabur Deployment Quick Start Guide

## 🚀 Quick Reference for Deploying Jarvis to Zeabur

### Pre-Deployment Checklist

Run the verification script:
```bash
./scripts/check-deployment.sh
```

### Step-by-Step Deployment

#### 1️⃣ Fix "No Branches Found" Issue

**Option A: Reconnect Repository (Recommended)**
```
1. Go to https://dash.zeabur.com
2. Navigate to your project
3. Go to Settings → Git
4. Remove current repository connection
5. Click "Add New Service" → "Git" → "GitHub"
6. Select "NeoKoo/Jarvis" from the list
7. Select "main" branch when prompted
```

**Option B: Verify GitHub App Permissions**
```
1. Visit https://github.com/settings/installations
2. Find "Zeabur" app
3. Click "Configure"
4. Ensure "NeoKoo/Jarvis" is selected
5. Ensure "Contents" permission = "Read"
6. Save changes
7. Return to Zeabur and retry
```

#### 2️⃣ Configure Build Settings

In Zeabur service configuration:

```
Service Type: Prebuilt Service (Dockerfile) or Next.js
Root Directory: / (leave as default)

Build Settings:
├─ Build Command: npm run build
├─ Install Command: npm install
├─ Output Directory: .next
└─ Node.js Version: 20.x (recommended)

Environment Variables:
├─ NODE_ENV=production
├─ QWEN_API_KEY=your_key_here (optional)
└─ GLM_API_KEY=your_key_here (optional)
```

#### 3️⃣ Deploy

```
1. Click "Deploy" or "Create Service"
2. Wait for build to complete (~2-3 minutes)
3. Access your app at: https://your-project.zeabur.app
```

### 📋 Configuration Files Created

- ✅ `Dockerfile` - Optimized for Zeabur deployment
- ✅ `next.config.js` - Updated with standalone output
- ✅ `.dockerignore` - Optimized Docker builds
- ✅ `ZEABUR_DEPLOYMENT.md` - Full deployment guide
- ✅ `scripts/check-deployment.sh` - Pre-deployment verification

### 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| No Branches Found | Reconnect repository in Zeabur |
| Build Fails | Check Node.js version (use 20.x) |
| PWA Not Working | Verify next-pwa compatibility with Next.js 15 |
| Permission Denied | Check GitHub App permissions |

### 📚 Additional Resources

- [Zeabur Documentation](https://zeabur.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Full Deployment Guide](./ZEABUR_DEPLOYMENT.md)

### ✅ Success Indicators

- ✅ Build completes without errors
- ✅ Service shows "Running" status
- ✅ App loads at Zeabur URL
- ✅ PWA install prompt appears

---

**Need Help?** Check the full [ZEABUR_DEPLOYMENT.md](./ZEABUR_DEPLOYMENT.md) for detailed troubleshooting.
