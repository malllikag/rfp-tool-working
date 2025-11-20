# Single Vercel Deployment - Simplified Approach

## 🎯 Strategy

Since you want **one Vercel link** (like your prototype), I've simplified the architecture:

- **Frontend**: React app (static files)
- **File Handling**: Client-side (no server storage needed)
- **AI Generation**: Single serverless function `/api/generate-pid`

This means:
- ✅ One Vercel URL
- ✅ No separate backend needed
- ✅ Works exactly like your prototype
- ⚠️ Files are processed client-side (not stored on server)

## 📦 What's Ready

1. **Serverless API**: `/api/generate-pid.js` - handles PID generation
2. **Vercel Config**: `vercel.json` - configured for deployment
3. **Frontend**: Already updated to work with environment variables

## 🚀 Deploy Now

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Ready for Vercel deployment"
   git branch -M main
   ```
   
   Then create a repo on GitHub and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/rfp-tool.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import" your GitHub repo
   - Add environment variable:
     - Name: `GEMINI_API_KEY`
     - Value: `your-gemini-api-key`
   - Click **Deploy**

3. **Done!** You'll get a link like: `https://your-app.vercel.app`

### Option 2: Deploy via CLI (Faster)

```bash
npm install -g vercel
vercel
```

Follow the prompts and add your `GEMINI_API_KEY` when asked.

## ⚠️ Important Notes

**File Storage Limitation**:
- Files are NOT stored on the server
- Each upload is processed immediately and discarded
- History page won't persist files between sessions
- This is the same as your prototype behavior

**To add persistent storage later**:
- Use Vercel Blob Storage
- Or use a database like Supabase/Firebase

## 🎉 Result

You'll get **one shareable Vercel link** that works immediately!

Example: `https://ai-planner-rfp-tool.vercel.app`
