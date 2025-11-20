# 🚀 Quick Deployment Guide - Get Your Shareable Link!

## ⏱️ Total Time: ~15 minutes

Follow these steps to get your shareable link:

---

## Step 1: Push Code to GitHub (5 minutes)

### 1.1 Initialize Git (if not done)
```bash
git init
git add .
git commit -m "Initial commit - ready for deployment"
```

### 1.2 Create GitHub Repository
1. Go to [github.com/new](https://github.com/new)
2. Name it: `rfp-to-pid-tool` (or any name you like)
3. **Don't** initialize with README
4. Click "Create repository"

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/rfp-to-pid-tool.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway (5 minutes)

### 2.1 Sign Up
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub

### 2.2 Deploy
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `rfp-to-pid-tool` repository
4. Click **"Add variables"**
   - Add: `GEMINI_API_KEY` = `your-gemini-api-key-here`
5. Under **"Settings"** → **"Root Directory"**, set to: `backend`
6. Click **"Deploy"**

### 2.3 Get Your Backend URL
- Once deployed, click **"Settings"** → **"Domains"**
- Copy the URL (looks like: `https://your-app.railway.app`)
- **Save this URL!** You'll need it in the next step

---

## Step 3: Deploy Frontend to Vercel (5 minutes)

### 3.1 Sign Up
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub

### 3.2 Deploy
1. Click **"Add New..."** → **"Project"**
2. Import your `rfp-to-pid-tool` repository
3. Vercel will auto-detect Vite
4. **Before deploying**, add environment variable:
   - Click **"Environment Variables"**
   - Name: `VITE_API_URL`
   - Value: `https://your-app.railway.app` (your Railway URL from Step 2.3)
5. Click **"Deploy"**

### 3.3 Get Your Shareable Link! 🎉
- Once deployed, Vercel will show your URL
- It looks like: `https://your-app.vercel.app`
- **This is your shareable link!**

---

## Step 4: Update Railway CORS (2 minutes)

1. Go back to Railway dashboard
2. Click on your project
3. Go to **"Variables"**
4. Add new variable:
   - Name: `FRONTEND_URL`
   - Value: `https://your-app.vercel.app` (your Vercel URL from Step 3.3)
5. Railway will auto-redeploy

---

## ✅ Done! Test Your App

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Upload a test RFP file
3. Generate a PID
4. Check the History page

**Share this link with anyone!** 🎊

---

## 🔧 Troubleshooting

### If file upload doesn't work:
- Check Railway logs for errors
- Verify `GEMINI_API_KEY` is set correctly

### If API calls fail:
- Check `VITE_API_URL` in Vercel matches your Railway URL
- Check `FRONTEND_URL` in Railway matches your Vercel URL
- Make sure both URLs use `https://` (not `http://`)

### Need to update code?
```bash
git add .
git commit -m "Update"
git push
```
Both Vercel and Railway will auto-deploy!

---

## 📝 Your URLs Summary

Fill these in as you go:

- **GitHub Repo**: https://github.com/YOUR_USERNAME/rfp-to-pid-tool
- **Railway Backend**: https://______________.railway.app
- **Vercel Frontend (SHAREABLE LINK)**: https://______________.vercel.app

---

**Questions?** Let me know which step you're on and I can help!
