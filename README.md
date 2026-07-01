# WordGuess — Real-Time Multiplayer Word Guessing Game

<div align="center">

🎮 **A fast-paced multiplayer word guessing battle game** built with React, Vite, and Socket.IO

[Play Online](#deployment) • [GitHub](#) • [Android App](#android-deployment)

</div>

---

## 🎯 Features

- ⚡ **Real-time Multiplayer** – Play against opponents with Socket.IO
- 🎨 **Animated UI** – Smooth animations with motion/react
- 📱 **Mobile-First** – Fully responsive on all devices
- 💡 **Hint System** – 2 hints per round to reveal letters
- ⌨️ **Touch Keyboard** – On-screen letter grid for mobile play
- 🎉 **Live Chat** – Chat with opponents during gameplay
- 💬 **Persistent Username** – Saves your name in localStorage
- 🏆 **Win Streaks** – Track your winning streaks

---

## 🚀 Quick Start (Local Development)

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Set your backend URL (default: localhost:3000)
# VITE_SOCKET_URL=http://localhost:3000

# Start dev server (frontend on :5173)
npm run dev

# In another terminal, start backend (on :3000)
# Your Express server must be running on PORT 3000
node dist/server.cjs
```

---

## 📦 Deployment Guide: GitHub → Vercel → Android APK

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: WordGuess game"
git remote add origin https://github.com/YOUR_USERNAME/word-guess.git
git push -u origin main
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
npm i -g vercel
vercel
# Follow prompts, select your GitHub repo
# Set environment variable: VITE_SOCKET_URL = your-backend-url
```

#### Option B: Connect via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variable:
   - `VITE_SOCKET_URL` = `https://your-backend-domain.com` (your Express server URL)
5. Click "Deploy"

**Your app is now live at:** `https://your-project.vercel.app`

### Step 3: Convert to Android APK

#### Option A: Web Wrapper Tools (Fastest)
Use a free web-to-APK converter:
- **[PWA Builder](https://www.pwabuilder.com)** ⭐ Recommended
  1. Visit pwabuilder.com
  2. Enter your Vercel URL: `https://your-project.vercel.app`
  3. Click "Start"
  4. Download APK for Android
  5. Install on device via USB or share link

- **[CloudConvert](https://cloudconvert.com/web-to-apk)**
- **[Web2APK](https://web2apk.appspot.com)**

#### Option B: Capacitor (Advanced)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init WordGuess com.yourcompany.wordguess
npx cap add android
npm run build
npx cap copy
npx cap sync
npx cap open android
# Build APK in Android Studio
```

#### Option C: Google Play Console (Full Store Release)
1. Create [Google Play Developer account](https://play.google.com/console) ($25)
2. Create new app "WordGuess"
3. Upload APK or use Capacitor
4. Fill store listing, screenshots, description
5. Submit for review (~24-48 hours)

---

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SOCKET_URL` | Backend server URL | `https://api.example.com` |
| `GEMINI_API_KEY` | Google Gemini API key (if using AI features) | `your-key-here` |

### Setting on Vercel:
1. Go to Project Settings → Environment Variables
2. Add `VITE_SOCKET_URL` with your backend URL
3. Redeploy

---

## 📱 Android Deployment Checklist

- ✅ App runs on Vercel
- ✅ Socket.IO connection uses `VITE_SOCKET_URL`
- ✅ Backend server is publicly accessible (not localhost)
- ✅ PWA manifest configured (`manifest.json`)
- ✅ Service worker enabled (`service-worker.js`)
- ✅ HTTPS enabled (Vercel provides this by default)
- ✅ App icon set
- ✅ Tested on Android device (Chrome or native wrapper)

---

## 🛠️ Backend Deployment

Your Express backend (server.ts) needs to run separately:

### Option A: Railway.app (Recommended for beginners)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option B: Heroku
```bash
heroku login
heroku create your-wordguess-backend
git push heroku main
```

### Option C: AWS/Azure
- Use Docker container
- Deploy to EC2, App Service, or Compute Engine
- Ensure CORS is properly configured

**Important:** Update `VITE_SOCKET_URL` to point to your backend URL after deployment.

---

## 🎮 How to Play

1. **Enter your name** on the splash screen
2. **Create or join a room** in the lounge
3. **Submit your secret word** (3-15 letters)
4. **Take turns guessing** letters from opponent's word
5. **Use hints strategically** (max 2 per game)
6. **Win by revealing** the opponent's word first
7. **Chat** with emoji or text during gameplay

---

## 📊 Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Build:** Vite + esbuild
- **Real-time:** Socket.IO
- **Animations:** motion/react
- **Deployment:** Vercel (frontend) + Railway/Heroku (backend)
- **PWA:** Service Worker + Manifest

---

## 🐛 Troubleshooting

### "Cannot reach server"
- ✅ Check `VITE_SOCKET_URL` environment variable
- ✅ Ensure backend server is running and publicly accessible
- ✅ Verify CORS is enabled on backend

### "App won't install from APK"
- ✅ Enable "Unknown Sources" in Android Settings
- ✅ Verify APK was built from correct URL
- ✅ Check minimum Android version (6.0+)

### "Service Worker not registering"
- ✅ Ensure HTTPS is enabled
- ✅ Check browser console for errors
- ✅ Clear browser cache and reinstall

---

## 📝 License

Open source - feel free to fork and modify!

---

## 🤝 Support

For issues or questions:
1. Check [GitHub Issues](https://github.com/YOUR_USERNAME/word-guess/issues)
2. Review troubleshooting section above
3. Submit a new issue with:
   - Device/OS info
   - Error message
   - Steps to reproduce

---

**Happy Gaming! 🎮**
