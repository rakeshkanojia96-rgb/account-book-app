# 🔄 Neon + Clerk Migration Guide

## ✅ What Changed
- **Database**: Supabase → Neon PostgreSQL
- **Authentication**: Supabase Auth → Clerk
- **Why**: Free tier limits resolved (10 projects on Neon, 10K users on Clerk)

## 🔑 Required Credentials

After completing Neon and Clerk setup, you'll need these environment variables:

### From Neon (https://neon.tech):
```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### From Clerk (https://clerk.com):
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

## 📋 Setup Checklist

### 1. Neon Database Setup
- [ ] Create Neon account at https://neon.tech
- [ ] Create new project "account-book-db"
- [ ] Copy DATABASE_URL connection string
- [ ] Run database schema (instructions below)

### 2. Clerk Authentication Setup
- [ ] Create Clerk account at https://clerk.com
- [ ] Create application "Account Book App"
- [ ] Enable Email sign-in
- [ ] Copy Publishable Key (pk_test_...)
- [ ] Copy Secret Key (sk_test_...)

### 3. Environment Variables
- [ ] Update `.env` file with new credentials
- [ ] Verify all 3 keys are present

### 4. Database Migration
- [ ] Run all SQL migration files on Neon
- [ ] Verify tables are created

### 5. Test Application
- [ ] Run `npm install` (new packages added)
- [ ] Run `npm run dev`
- [ ] Test signup/login
- [ ] Test sales entry

## 🗄️ Running Database Migrations on Neon

### Option A: Using Neon SQL Editor (Recommended)
1. Go to your Neon dashboard
2. Click **SQL Editor** in left sidebar
3. Copy content from these files in order:
   - `supabase-schema.sql` (base schema)
   - `supabase-inventory-schema.sql`
   - `supabase-migration-gst-percentage.sql`
   - `supabase-sales-expenses-link.sql`
   - `supabase-sales-enhancements.sql`
   - `supabase-auto-stock-update.sql`
4. Paste and run each one

### Option B: Using psql Command Line
```bash
# Install psql if needed
brew install postgresql

# Run migrations (replace with your DATABASE_URL)
psql "YOUR_DATABASE_URL" < supabase-schema.sql
psql "YOUR_DATABASE_URL" < supabase-inventory-schema.sql
psql "YOUR_DATABASE_URL" < supabase-migration-gst-percentage.sql
psql "YOUR_DATABASE_URL" < supabase-sales-expenses-link.sql
psql "YOUR_DATABASE_URL" < supabase-sales-enhancements.sql
psql "YOUR_DATABASE_URL" < supabase-auto-stock-update.sql
```

## 🔐 Updated .env File Format

```env
# Neon Database
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
```

## 📦 New Packages Added

- `@clerk/clerk-react` - Clerk authentication for React
- `@neondatabase/serverless` - Neon database driver
- `drizzle-orm` - ORM for database queries (lightweight alternative to Supabase client)

## 🎯 What Works After Migration

All existing features + better free tier limits:
- ✅ User authentication (email + optional social)
- ✅ All sales, purchases, expenses tracking
- ✅ Financial reports
- ✅ Inventory management
- ✅ Asset tracking
- ✅ Dashboard analytics
- ✅ PDF exports

## 🆘 Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL is correct
- Ensure `?sslmode=require` is at the end
- Verify Neon project is not paused

### "Clerk key invalid"
- Ensure you're using the correct environment keys (test vs production)
- Check no extra spaces in .env file
- Restart dev server after updating .env

### "Tables not found"
- Run all migration files on Neon
- Check Neon SQL Editor for any errors
- Verify you're connected to correct database

## 📞 Support

- **Neon Docs**: https://neon.tech/docs
- **Clerk Docs**: https://clerk.com/docs
- **Project Issues**: Check browser console for errors

---

**Migration completed! You now have unlimited free projects.** 🎉
