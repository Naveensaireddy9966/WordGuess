# Production Socket.IO Configuration

## Overview

When deploying to production (Vercel + Android APK), you need to:
1. Host your Express backend server externally (not localhost)
2. Set the `VITE_SOCKET_URL` environment variable
3. Enable CORS on your backend
4. Use HTTPS for both frontend and backend

---

## Environment Variable: VITE_SOCKET_URL

### What it does
- Tells the React app where your Socket.IO backend is located
- Used when connecting to multiplayer game server
- Can be different for development, staging, and production

### How to set it

#### Local Development (.env.local)
```env
VITE_SOCKET_URL=http://localhost:3000
```

#### Vercel (Environment Variables)
1. Go to Project Settings → Environment Variables
2. Add new variable:
   ```
   Name: VITE_SOCKET_URL
   Value: https://your-backend-url.com
   Environments: All (Production, Preview, Development)
   ```
3. Redeploy after adding

#### Android APK
The APK will use the `VITE_SOCKET_URL` from your Vercel deployment at the time you generated it from PWA Builder.

---

## Backend Hosting Options

### Option 1: Railway.app (Recommended) ⭐

**Pros:**
- Easy setup for Node.js/Express
- Free tier available
- Automatic HTTPS
- Good for beginners

**Setup:**
```bash
# 1. Create account at railway.app
# 2. Create new project
# 3. Connect GitHub repo
# 4. Add file: railway.toml
```

**railway.toml:**
```toml
[build]
builder = "nixpacks"

[deploy]
numReplicas = 1
restartPolicyMaxRetries = 0
startCommand = "npm run start"
```

**In Railway dashboard:**
- Set environment variable: `PORT=3000`
- Deployment URL: `https://your-project.railway.app`

**Use in Vercel:**
```
VITE_SOCKET_URL=https://your-project.railway.app
```

---

### Option 2: Heroku

**Pros:**
- Long-standing platform
- Good integration with GitHub
- CLI-based deployment

**Setup:**
```bash
# 1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
# 2. Login
heroku login

# 3. Create app
heroku create your-wordguess-backend

# 4. Deploy
git push heroku main

# 5. Get URL
heroku info -s | grep web_url
```

**Procfile (required):**
```
web: npm run start
```

**Use in Vercel:**
```
VITE_SOCKET_URL=https://your-wordguess-backend.herokuapp.com
```

---

### Option 3: AWS EC2

**Pros:**
- Full control
- Scalable
- Good for production

**Setup:**
```bash
# 1. Create EC2 instance (Ubuntu 22.04, t3.micro free tier)
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Clone your repo
git clone https://github.com/YOUR_USERNAME/word-guess.git
cd word-guess

# 5. Install dependencies
npm install

# 6. Run with PM2 (keeps it running)
npm install -g pm2
pm2 start "npm run start" --name "wordguess"
pm2 save

# 7. Get public IP and port
# Your URL: http://your-instance-ip:3000 (use HTTP on same VPC)
```

**Use in Vercel:**
```
VITE_SOCKET_URL=http://your-instance-ip:3000
```

---

### Option 4: Google Cloud Run

**Pros:**
- Pay-per-use (free tier available)
- Automatic HTTPS
- Serverless (no VM management)

**Setup:**
```bash
# 1. Install Google Cloud SDK
# 2. Authenticate
gcloud auth login

# 3. Create Docker image
docker build -t wordguess-backend .

# 4. Push to Container Registry
docker tag wordguess-backend gcr.io/YOUR-PROJECT/wordguess-backend
docker push gcr.io/YOUR-PROJECT/wordguess-backend

# 5. Deploy to Cloud Run
gcloud run deploy wordguess-backend \
  --image gcr.io/YOUR-PROJECT/wordguess-backend \
  --platform managed \
  --region us-central1 \
  --port 3000

# 6. Get service URL
# Your URL: https://wordguess-backend-xxxxx.a.run.app
```

**Use in Vercel:**
```
VITE_SOCKET_URL=https://wordguess-backend-xxxxx.a.run.app
```

---

## CORS Configuration (Backend)

Your Express server must allow requests from your Vercel frontend. Update `server.ts`:

```typescript
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});
```

Or allow specific domains:

```typescript
const allowedOrigins = [
  "https://your-project.vercel.app",
  "http://localhost:5173",  // local dev
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"]
  }
});
```

---

## Deployment Workflow Summary

```
Your Computer (Development)
  ↓
GitHub (Code Repository)
  ↓
├─→ Vercel (Frontend → https://your-project.vercel.app)
│   └─→ PWA Builder (APK)
│       └─→ Android APK (Ready to install)
│
└─→ Railway/Heroku (Backend → https://your-backend.com)
    └─→ Vercel env var: VITE_SOCKET_URL=https://your-backend.com
        └─→ Connected via Socket.IO
```

---

## Testing Production Connection

### Test frontend ↔ backend connection:

**In browser console (DevTools F12):**
```javascript
// Check environment variables
console.log(import.meta.env.VITE_SOCKET_URL)

// Should output: https://your-backend-url.com
```

**If showing `undefined`:**
- Backend URL not set in Vercel environment variables
- Frontend needs to be redeployed after adding the variable

---

## Troubleshooting Production Issues

### "Cannot reach server" on Android app

**Check:**
1. Backend is actually running
   ```bash
   curl https://your-backend-url.com
   ```

2. VITE_SOCKET_URL is set in Vercel
   - Go to Project Settings → Environment Variables
   - Verify the value

3. CORS is enabled on backend
   - Check `server.ts` Socket.IO CORS config

4. Verify DNS resolution
   ```bash
   nslookup your-backend-url.com
   ```

### "CORS error" in DevTools console

**Fix in server.ts:**
```typescript
const io = new Server(server, {
  cors: {
    origin: "*",  // Allow all for now
    methods: ["GET", "POST"]
  }
});
```

---

## Security Notes ⚠️

- [ ] Never commit `.env.local` to GitHub
- [ ] Use strong credentials for hosting providers
- [ ] Enable HTTPS for both frontend and backend
- [ ] Validate all user inputs on backend
- [ ] Use authentication for sensitive features
- [ ] Keep dependencies updated: `npm audit fix`
- [ ] Rotate API keys regularly

---

## Performance Tips

1. **Backend:** Use `NODE_ENV=production` for optimization
2. **Socket.IO:** Enable compression for large messages
3. **Frontend:** Already optimized with Vite + esbuild
4. **Database:** Add caching for frequently accessed data
5. **Monitoring:** Track uptime and errors

---

**Ready to go live! 🚀**
