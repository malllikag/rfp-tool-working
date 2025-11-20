# Vercel Deployment - Quick Start

## 🚀 Easiest Deployment Option: Split Architecture

Since your app has file uploads and a backend server, the **easiest and most reliable** approach is to deploy frontend and backend separately:

### Frontend → Vercel (Free)
### Backend → Railway (Free tier available)

---

## Option 1: Deploy Frontend Only to Vercel (Recommended First Step)

This deploys just your React frontend to Vercel. The backend will need to be deployed elsewhere.

### Steps:

1. **Update API URLs in your code** to use environment variables:

   Create `.env` file in project root:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

   Update all fetch calls to use this:
   ```typescript
   // Instead of: fetch("http://localhost:5000/api/projects")
   // Use:
   const API_URL = import.meta.env.VITE_API_URL || '';
   fetch(`${API_URL}/api/projects`)
   ```

2. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Add environment variable in Vercel**:
   - Go to your project settings
   - Add `VITE_API_URL` = `https://your-backend-url.railway.app` (after deploying backend)

---

## Option 2: Deploy Backend to Railway

Railway is perfect for your Express backend with file uploads.

### Steps:

1. **Create Railway account**: [railway.app](https://railway.app)

2. **Create `railway.json`** in `/backend` directory:
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "node server.js",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

3. **Update CORS in `backend/server.js`**:
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL || '*',
     credentials: true
   }));
   ```

4. **Deploy**:
   - Connect your GitHub repo to Railway
   - Set root directory to `/backend`
   - Add environment variable: `GEMINI_API_KEY`
   - Railway will auto-deploy

5. **Get your Railway URL** and update Vercel's `VITE_API_URL`

---

## Option 3: All-in-One Vercel (Advanced - Requires Code Changes)

This requires converting your Express backend to Vercel Serverless Functions.

**⚠️ Limitations:**
- No persistent file storage (need cloud storage like S3)
- 10-second timeout on free tier
- More complex setup

I can help you implement this if needed, but I recommend Option 1 + 2 for simplicity.

---

## 🎯 Recommended Path

1. ✅ Deploy frontend to Vercel (5 minutes)
2. ✅ Deploy backend to Railway (5 minutes)  
3. ✅ Connect them via environment variables (2 minutes)

**Total time: ~12 minutes**

---

## Need Help?

Let me know which option you'd like to pursue:
- **Option 1**: I'll help update your code for split deployment
- **Option 2**: I'll help set up Railway for backend
- **Option 3**: I'll convert your backend to serverless functions

Just say which one you prefer!
