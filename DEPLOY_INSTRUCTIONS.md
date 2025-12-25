# 🚀 Quick Deployment Instructions

## Step 1: Push to GitHub

Run this command (replace YOUR_TOKEN with your GitHub token):

```bash
cd "/Users/rakesh/Documents/Windsurf Works GST/Account Book App"
git push https://YOUR_TOKEN@github.com/rakeshkanojia96-rgb/account-book-app.git main
```

Get token at: https://github.com/settings/tokens

## Step 2: Deploy to Vercel

1. Go to **https://vercel.com**
2. Sign in with GitHub
3. Click **"Add New"** → **"Project"**
4. Select: **rakeshkanojia96-rgb/account-book-app**
5. Click **"Import"**

### Build Settings:
- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Root Directory: `./`

### Environment Variables (Click "Add"):

**Variable 1:**
```
DATABASE_URL
postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_NEON_HOST/YOUR_DATABASE?sslmode=require
```

**Variable 2:**
```
VITE_CLERK_PUBLISHABLE_KEY
pk_test_your_clerk_publishable_key
```

6. Click **"Deploy"**

## Step 3: Configure Clerk Production Domain

After deployment:
1. Copy your Vercel URL (e.g., `account-book-app.vercel.app`)
2. Go to **https://dashboard.clerk.com**
3. Select your app
4. Go to **"Domains"** → Add your Vercel URL
5. Save

## Done! 🎉

Your app will be live at: `https://your-app.vercel.app`
