# 🚀 Quick Start - Account Book App

Your e-commerce accounting application is ready! Follow these steps:

## ⚡ Before You Start

You need:
1. ✅ Node.js installed (already have it)
2. ✅ A Supabase account (free) - [Get it here](https://supabase.com)
3. ✅ 15 minutes of time

---

## 📝 Setup Checklist

### 1️⃣ Set Up Supabase Database (5 minutes)

**Create Project:**
- Go to https://supabase.com → Sign up/Login
- Click "New Project"
- Name: `account-book-db`
- Create a strong password (save it!)
- Choose region (Mumbai for India)
- Wait 2-3 minutes

**Create Database Tables:**
- Click **SQL Editor** in sidebar
- Click "New Query"
- Open `supabase-schema.sql` from this project
- Copy ALL content and paste in editor
- Click **RUN**
- See "Success" message

**Get API Keys:**
- Go to **Settings** → **API**
- Copy **Project URL**
- Copy **anon public** key

### 2️⃣ Configure Environment Variables (2 minutes)

Create `.env` file in project root:
```env
VITE_SUPABASE_URL=paste_your_project_url_here
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

### 3️⃣ Start the App (1 minute)

```bash
npm run dev
```

App opens at: http://localhost:3000

### 4️⃣ Create Account & Start Using! (2 minutes)

1. Click "Sign Up"
2. Fill your details
3. Verify email
4. Login and start!

---

## 🎯 What You Can Do

### Daily Operations
- ✅ **Add Sales** - Track Meesho, Amazon, Flipkart sales
- ✅ **Record Purchases** - Materials, packing, inventory
- ✅ **Log Expenses** - Shipping, commission, rent, etc.
- ✅ **Manage Assets** - Auto-depreciation tracking

### Reports & Analytics
- 📊 **Dashboard** - Real-time overview
- 📈 **Profit & Loss** - Detailed P&L statement
- 💰 **Balance Sheet** - Assets & liabilities
- 📉 **Cash Flow** - Track cash movements
- 🏪 **Platform Analytics** - Compare Meesho vs Amazon vs Flipkart

### Features
- 🔄 **Auto GST Calculation** - 18% GST on all transactions
- 💾 **Cloud Sync** - Access from any device
- 📱 **Mobile Friendly** - Works on phone, tablet, desktop
- 📄 **PDF Export** - Download reports
- 🔐 **Secure** - Your data is protected

---

## 📚 File Structure

```
Account Book App/
├── src/
│   ├── pages/           # All pages (Dashboard, Sales, etc.)
│   ├── components/      # Reusable components
│   ├── lib/            # Supabase config
│   └── store/          # State management
├── supabase-schema.sql  # Database setup
├── .env.example        # Environment template
├── README.md           # Full documentation
├── SETUP_GUIDE.md      # Detailed setup
└── package.json        # Dependencies
```

---

## 🔥 Common Tasks

### Add a Sale Entry
1. Dashboard → Click "Add Sale"
2. Fill: Date, Customer, Platform, Product, Price
3. GST calculated automatically
4. Click "Add Sale"

### View Reports
1. Go to "Reports" tab
2. Select report type (P&L, Balance Sheet, etc.)
3. Choose financial year
4. Click "Export PDF" if needed

### Track Assets
1. Go to "Assets" tab
2. Click "Add Asset"
3. Enter: Name, Purchase date, Price, Depreciation method
4. Depreciation calculated automatically

---

## 🌐 Deploy to Internet (Optional)

### Free Deployment on Vercel:

```bash
# 1. Push to GitHub (if not already)
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main

# 2. Go to vercel.com
# 3. Import your GitHub repo
# 4. Add environment variables
# 5. Deploy!
```

**Result**: Your app live at `https://your-app.vercel.app`

---

## 💡 Pro Tips

1. **Daily Entry** - Enter transactions daily for best results
2. **Backup** - Data is auto-backed up in Supabase
3. **Mobile Access** - Add to home screen for quick access
4. **Reports** - Generate month-end and year-end reports
5. **Categories** - Use consistent categories for better analytics

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| App won't start | Run `npm install` then `npm run dev` |
| Login fails | Check email verification |
| Data not showing | Verify Supabase schema is created |
| Environment error | Check `.env` file exists with correct values |

---

## 📞 Next Steps

1. ✅ Complete Supabase setup
2. ✅ Configure `.env` file
3. ✅ Run `npm run dev`
4. ✅ Create account
5. ✅ Add your first transaction!

**Ready to manage your e-commerce accounting like a pro!** 🎉

---

For detailed documentation, see `README.md`  
For step-by-step setup, see `SETUP_GUIDE.md`
