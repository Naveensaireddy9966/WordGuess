# 🚀 WordGuess Deployment Checklist

## Pre-Deployment (Local Testing)

- [ ] `npm install` dependencies installed
- [ ] `npm run build` succeeds without errors
- [ ] `npm run dev` starts without issues
- [ ] App loads at `http://localhost:5173`
- [ ] Game works locally with backend running

---

## GitHub Setup

- [ ] Created GitHub repository: `https://github.com/YOUR_USERNAME/word-guess`
- [ ] Committed all code: `git add . && git commit -m "Initial commit" && git push`
- [ ] `.env.local` is in `.gitignore` (never push secrets)
- [ ] `.env.example` is committed with template values

---

## Backend Deployment (Choose One)

### Railway (Recommended)
- [ ] Account created at [railway.app](https://railway.app)
- [ ] Project created for backend
- [ ] Backend deployed
- [ ] Public URL obtained (e.g., `https://your-backend.railway.app`)
- [ ] CORS configured to allow Vercel frontend URL

### Heroku
- [ ] Account created at [heroku.com](https://heroku.com)
- [ ] Heroku CLI installed
- [ ] App created: `heroku create your-wordguess-backend`
- [ ] Deployed: `git push heroku main`
- [ ] URL obtained: `https://your-wordguess-backend.herokuapp.com`

### AWS / Azure / Other
- [ ] Backend deployed to cloud provider
- [ ] Public HTTPS URL obtained
- [ ] CORS enabled for frontend domain

**Note:** Backend URL will be used as `VITE_SOCKET_URL` in Vercel

---

## Vercel Frontend Deployment

### Step 1: Connect GitHub
- [ ] Account created at [vercel.com](https://vercel.com)
- [ ] GitHub connected to Vercel
- [ ] Repository authorized

### Step 2: Create Project
- [ ] Click "New Project"
- [ ] Select your GitHub repository
- [ ] Framework: Auto-detected as Vite
- [ ] Root directory: `./` (default)

### Step 3: Environment Variables
- [ ] Click "Environment Variables"
- [ ] Add variable:
  ```
  Name: VITE_SOCKET_URL
  Value: https://your-backend-domain.com
  Environments: Production, Preview, Development
  ```
- [ ] Apply to all environments

### Step 4: Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (~2 min)
- [ ] Verify deployment successful
- [ ] Frontend URL: `https://your-project.vercel.app` ✅

---

## Testing (Before Android Conversion)

- [ ] Visit `https://your-project.vercel.app`
- [ ] App loads (no blank page)
- [ ] Can enter name and play game
- [ ] Socket.IO connects to backend
- [ ] Real-time gameplay works
- [ ] Chat works
- [ ] Hints work
- [ ] Open DevTools → Console → no errors

---

## PWA Installation (Optional - Desktop/Mobile Browser)

- [ ] Open `https://your-project.vercel.app`
- [ ] Browser address bar shows install icon (or 3-dots menu)
- [ ] Click "Install app" / "Add to home screen"
- [ ] App appears on home screen as installable PWA
- [ ] Opens in fullscreen mode

---

## Android APK Conversion

### Method 1: PWA Builder (Easiest) ⭐
- [ ] Go to [pwabuilder.com](https://www.pwabuilder.com)
- [ ] Enter: `https://your-project.vercel.app`
- [ ] Click "Start"
- [ ] Review your app details
- [ ] Go to "Package" section
- [ ] Select Android
- [ ] Click "Download" → APK file downloaded
- [ ] **APK ready to install!**

### Method 2: Capacitor (Advanced)
- [ ] `npm install @capacitor/core @capacitor/cli`
- [ ] `npx cap init WordGuess com.yourcompany.wordguess`
- [ ] `npx cap add android`
- [ ] `npm run build`
- [ ] `npx cap copy && npx cap sync`
- [ ] `npx cap open android` (opens Android Studio)
- [ ] Build APK in Android Studio
- [ ] APK ready to install

---

## Install APK on Android Device

- [ ] Download APK file to device (or via email/cloud)
- [ ] Open file manager on Android
- [ ] Tap APK file
- [ ] Grant permissions if prompted
- [ ] Click "Install"
- [ ] App appears in app drawer
- [ ] Launch app ✅

---

## Post-Launch Verification

### Desktop (Chrome/Safari)
- [ ] Visit `https://your-project.vercel.app`
- [ ] All features work
- [ ] Sounds enabled
- [ ] Multiplayer works
- [ ] Chat works
- [ ] No console errors

### Android App
- [ ] Tap app icon to launch
- [ ] Splash screen appears
- [ ] Name entry modal works
- [ ] Can create/join rooms
- [ ] Game plays smoothly
- [ ] Chat works
- [ ] No crashes

---

## Deployment Summary

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ | `https://your-project.vercel.app` |
| Backend | ✅ | `https://your-backend-domain.com` |
| Android APK | ✅ | Ready for download |
| PWA | ✅ | Installable from browser |

---

## Troubleshooting

### "Cannot connect to server"
```
Fix: Update VITE_SOCKET_URL in Vercel environment variables
```

### "Service Worker not loading"
```
Fix: Ensure public/service-worker.js exists and HTTPS is enabled
```

### "APK install fails"
```
Fix: Enable "Unknown Sources" in Android Settings > Security
```

### "App crashes on startup"
```
Fix: Check DevTools console for JS errors
  - Rebuild APK with latest code
  - Verify backend is running
```

---

## Next Steps (Optional)

- [ ] Submit to Google Play Store
  - Create developer account ($25)
  - Upload APK or use Play Console
  - Add screenshots and description
  - Submit for review
  
- [ ] Set up analytics
  - Add Google Analytics or Mixpanel
  
- [ ] Configure auto-updates
  - Set up release pipeline
  
- [ ] Add more features
  - Leaderboards
  - Daily challenges
  - Profile customization

---

**Deployment Complete! 🎉**
