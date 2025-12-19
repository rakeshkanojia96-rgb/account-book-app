# Quick Setup Guide

Follow these steps to get your Account Book app running in 15 minutes!

## Step 1: Install Dependencies (2 minutes)

Open terminal in the project folder and run:
```bash
npm install
```

## Step 2: Create Supabase Account (3 minutes)

1. Go to https://supabase.com
2. Click "Start your project" (sign in with GitHub recommended)
3. Create a new organization (if first time)
4. Click "New Project"
5. Fill in:
   - **Name**: account-book-db
   - **Database Password**: (create a strong password and save it)
   - **Region**: Choose closest to you (e.g., Mumbai for India)
6. Click "Create new project"
7. Wait 2-3 minutes for setup

## Step 3: Set Up Database (3 minutes)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click "New Query"
3. Open `supabase-schema.sql` file from this project
4. Copy ALL the SQL code (Ctrl+A, Ctrl+C)
5. Paste in Supabase SQL Editor
6. Click **RUN** button (bottom right)
7. You should see "Success. No rows returned"

✅ Your database is ready!

## Step 4: Get API Credentials (2 minutes)

1. In Supabase dashboard, go to **Settings** → **API** (gear icon, left sidebar)
2. Find **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - Copy this URL
3. Find **Project API keys** → **anon/public** key
   - Copy this key (starts with `eyJ...`)

## Step 5: Configure App (2 minutes)

1. In project folder, find `.env.example` file
2. Create a copy and rename it to `.env`
3. Open `.env` file in any text editor
4. Replace with your actual values:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. Save the file

## Step 6: Start the App! (1 minute)

In terminal, run:
```bash
npm run dev
```

The app will open at: **http://localhost:3000**

## Step 7: Create Your Account (2 minutes)

1. Click "Sign Up"
2. Fill in:
   - Business Name (e.g., "My Gown Store")
   - Your Name
   - Email
   - Password (min 6 characters)
   - GST Number (optional)
3. Click "Create Account"
4. Check your email for verification link
5. Click the verification link
6. Go back to app and login

🎉 **You're all set!** Start adding your transactions.

---

## Quick Test

Try adding a sample sale:
1. Click "Add Sale" button
2. Fill in:
   - Date: Today
   - Customer: Test Customer
   - Platform: Meesho
   - Product: Sample Gown
   - Quantity: 1
   - Unit Price: 1000
3. Click "Add Sale"

You should see your first entry!

---

## Need Help?

### App not starting?
- Make sure you ran `npm install` first
- Check Node.js version: `node -v` (should be 16+)
- Try deleting `node_modules` folder and run `npm install` again

### Database errors?
- Make sure you ran the complete SQL schema
- Check if tables are created: Go to Supabase → Table Editor
- You should see: sales, purchases, expenses, assets

### Login not working?
- Check email verification (check spam folder)
- Go to Supabase → Authentication → Users to see registered users
- In Supabase → Authentication → Email Templates, disable email confirmation for testing

### Environment variables not working?
- File must be named exactly `.env` (not `.env.txt`)
- Variables must start with `VITE_`
- Restart the dev server after adding variables

---

## Deploy to Internet (Optional)

### Free Deployment on Vercel:

1. Push code to GitHub
2. Go to https://vercel.com
3. Sign in with GitHub
4. Click "Import Project"
5. Select your repository
6. Add environment variables (same as .env)
7. Click "Deploy"

Done! Your app will be live at `https://your-app.vercel.app`

### Access from Phone/Tablet:

Just open the URL in any browser. No app installation needed!

---

**Pro Tip**: Bookmark the app URL on your phone's home screen for quick access!
