# Zeabur Deployment Guide for Jarvis

## Prerequisites Verification

✅ **Repository**: https://github.com/NeoKoo/Jarvis
✅ **Branch**: main (active and synced)
✅ **Type**: Public repository
✅ **Remote**: Properly configured

## Step 1: Fix Zeabur Connection Issue

The "No Branches Found" error occurs when Zeabur cannot properly access your GitHub repository. Follow these steps in order:

### Solution A: Reconnect Repository in Zeabur (Recommended)

1. **Go to Zeabur Console**
   - Visit https://dash.zeabur.com
   - Navigate to your project or create a new one

2. **Remove Existing Connection (if any)**
   - If you already have this repository connected:
     - Go to Project Settings → Git
     - Remove/Delete the current repository connection
     - This clears any cached connection issues

3. **Re-add the Repository**
   - Click "Add New Service" or "Import Project"
   - Select "Git" → "GitHub"
   - Browse and select `NeoKoo/Jarvis` from your repository list
   - **Important**: You should see the repository in the list without needing to search

4. **Verify Branch Detection**
   - After selecting the repository, Zeabur should auto-detect the `main` branch
   - If you still see "No Branches Found", proceed to Solution B

### Solution B: Verify GitHub App Permissions

1. **Check Zeabur GitHub App**
   - Visit: https://github.com/settings/installations
   - Find "Zeabur" in the list of installed GitHub Apps
   - Click "Configure" or "Settings"

2. **Verify Repository Access**
   - Ensure "Repository access" includes `NeoKoo/Jarvis`
   - If set to "Only select repositories", make sure Jarvis is checked
   - If set to "All repositories", it should automatically have access

3. **Check Permissions**
   - Ensure "Contents" permission is set to "Read" (minimum required)
   - Click "Save" or "Update" if you made changes

4. **Return to Zeabur**
   - Go back to Zeabur dashboard
   - Refresh the page or retry importing the repository

### Solution C: Use Direct Git URL Import

If the above solutions don't work, try importing via URL:

1. In Zeabur, select "Import from Git"
2. Choose "Manual Input" or "Custom URL"
3. Enter: `https://github.com/NeoKoo/Jarvis.git`
4. Click Import

## Step 2: Configure Zeabur Service

Once Zeabur successfully detects the branches:

### Service Configuration

```
Service Type: Prebuilt Service (Dockerfile) or Next.js
Repository: NeoKoo/Jarvis
Branch: main
Root Directory: / (leave as default)
```

### Build Settings

```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Environment Variables

**Critical**: Add these environment variables in Zeabur:

```bash
# Node Environment
NODE_ENV=production

# Optional: Add your API keys if the app needs them
# Copy from your .env.local or set up new ones
QWEN_API_KEY=your_production_key_here
GLM_API_KEY=your_production_key_here
```

### Runtime Settings

```
Node.js Version: 18.x or 20.x (recommended)
Port: Auto-detect (Next.js uses 3000 by default)
```

## Step 3: Deployment Verification

### Pre-Deployment Checklist

- [ ] Repository is accessible in Zeabur
- [ ] `main` branch is visible and selectable
- [ ] Environment variables are configured
- [ ] Build command is set to `npm run build`

### Post-Deployment Checklist

- [ ] Build completes successfully
- [ ] Service starts without errors
- [ ] Application is accessible via Zeabur URL
- [ ] PWA features work (offline functionality)

## Step 4: Troubleshooting

### Issue: "No Branches Found" Persists

**Possible Causes:**
1. Zeabur GitHub App lost permissions
2. Repository was recently made public (cache delay)
3. Browser cache issue

**Solutions:**
- Try incognito/private mode in browser
- Disconnect and reconnect GitHub account in Zeabur settings
- Wait 5-10 minutes and retry (for cache refresh)
- Contact Zeabur support if issue persists

### Issue: Build Fails

**Check:**
- Build logs in Zeabur console
- Node.js version compatibility (use Node 18+)
- All dependencies install correctly

**Common Fixes:**
- Ensure `next-pwa` is compatible with Next.js 15
- Check if `package.json` scripts are correct
- Verify no missing environment variables

### Issue: PWA Not Working

**Notes:**
- `next-pwa` v5.6.0 may have compatibility issues with Next.js 15
- If PWA causes build errors, consider:
  - Upgrading to latest `next-pwa` version
  - Or temporarily removing PWA config for deployment

## Alternative: Static Export (If Needed)

If Zeabur has issues with the Next.js server, you can configure static export:

1. Update `next.config.js`:
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Add this for static export
  images: {
    unoptimized: true // Required for static export
  }
}

module.exports = withPWA(nextConfig)
```

2. Update build command in Zeabur:
```
Build Command: npm run build
Output Directory: /out
```

## Current Configuration Summary

**Project Details:**
- Name: Jarvis PWA
- Framework: Next.js 15.1.3
- React: 19.0.0
- PWA: next-pwa 5.6.0
- UI: Radix UI + Tailwind CSS
- State: Zustand
- Database: Dexie (IndexedDB)

**Deployment Target:**
- Platform: Zeabur
- Repository: https://github.com/NeoKoo/Jarvis
- Branch: main
- Build: `npm run build`

## Next Steps

1. Follow Solution A first (reconnect repository)
2. If that fails, check GitHub App permissions (Solution B)
3. Verify deployment configuration
4. Monitor build logs
5. Test deployed application

## Support Links

- Zeabur Documentation: https://zeabur.com/docs
- Zeabur GitHub: https://github.com/zeabur
- Next.js Deployment: https://nextjs.org/docs/deployment
