# Account Book - E-commerce Accounting Application

A comprehensive accounting and book-keeping application designed for online sellers (Meesho, Amazon, Flipkart) with support for:
- Daily transaction entries (Purchases, Sales, Expenses)
- Asset management with automatic depreciation
- Real-time financial reports (P&L, Balance Sheet, Cash Flow)
- Platform-wise analytics
- GST calculations
- Multi-device access via cloud sync

## 🚀 Features

### Transaction Management
- **Sales**: Track online (Meesho, Amazon, Flipkart) and offline sales with automatic GST calculation
- **Purchases**: Record raw materials, packing materials, and inventory purchases
- **Expenses**: Manage operational expenses (shipping, commissions, utilities, etc.)
- **Returns**: Handle both purchase and sales returns

### Asset Management
- Asset registry with depreciation tracking
- Support for Straight Line and Written Down Value (WDV) methods
- Automatic depreciation calculation based on time elapsed

### Financial Reports
- **Profit & Loss Statement**: Real-time revenue, expenses, and profit calculation
- **Balance Sheet**: Assets, liabilities, and equity overview
- **Cash Flow Statement**: Track cash movements
- **Platform Analytics**: Compare performance across Meesho, Amazon, Flipkart
- **Export to PDF**: Download professional financial reports

### Dashboard
- Key metrics at a glance
- Monthly sales and purchase trends
- Platform-wise sales distribution
- Profit trend analysis

## 🛠️ Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: TailwindCSS with custom design system
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Charts**: Recharts
- **Icons**: Lucide React
- **PDF Export**: jsPDF with autoTable
- **State Management**: Zustand
- **Routing**: React Router v6

## 📋 Prerequisites

- Node.js 16+ and npm
- A Supabase account (free tier is sufficient)
- Modern web browser

## 🔧 Installation & Setup

### 1. Clone the repository
```bash
cd "Account Book App"
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Supabase

#### a. Create a Supabase project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project (note down the password)
4. Wait for the project to be ready

#### b. Set up the database
1. In your Supabase dashboard, go to **SQL Editor**
2. Open the `supabase-schema.sql` file from this project
3. Copy and paste the entire SQL code
4. Click "Run" to execute

This will create:
- 4 tables: `sales`, `purchases`, `expenses`, `assets`
- Row Level Security (RLS) policies for data protection
- Indexes for performance
- Triggers for automatic timestamp updates

#### c. Get your API credentials
1. In Supabase dashboard, go to **Settings** → **API**
2. Copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public key (starts with `eyJ...`)

### 4. Configure environment variables

Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run the development server
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click "Deploy"

Your app will be live at `https://your-app.vercel.app`

### Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to Netlify
3. Add environment variables in Netlify dashboard

### Deploy to GitHub Pages

Update `vite.config.js`:
```javascript
export default defineConfig({
  base: '/account-book-app/',
  // ... rest of config
})
```

Then:
```bash
npm run build
# Deploy the dist folder to gh-pages branch
```

## 📱 Usage Guide

### First Time Setup
1. **Sign Up**: Create an account with your email
2. **Business Profile**: Fill in business name, owner name, and GST number
3. **Start Adding Entries**: Begin recording transactions

### Daily Workflow
1. Add sales entries as orders are delivered
2. Record purchases when materials are bought
3. Track expenses like shipping, commissions
4. Assets are automatically depreciated

### Month-End Review
1. Go to **Dashboard** for overview
2. Check **Reports** for P&L and Balance Sheet
3. Export reports as PDF for records
4. Analyze platform-wise performance

### Year-End
1. Generate annual P&L statement
2. Create Balance Sheet
3. Export all reports
4. Data is automatically carried forward

## 🔐 Security Features

- ✅ Secure authentication with Supabase Auth
- ✅ Row Level Security (RLS) - users can only access their own data
- ✅ Encrypted data transmission (HTTPS)
- ✅ Automatic session management
- ✅ Password hashing
- ✅ Email verification

## 📊 Financial Year

The app follows the Indian financial year:
- **Start**: April 1st
- **End**: March 31st

This aligns with GST compliance requirements.

## 🎯 Key Metrics Tracked

- Total Sales (platform-wise)
- Total Purchases (category-wise)
- Operating Expenses
- Gross Profit Margin
- Net Profit Margin
- Asset Values
- Depreciation

## 🆘 Troubleshooting

### "Missing Supabase environment variables" error
- Ensure `.env` file exists in project root
- Check that variable names start with `VITE_`
- Restart development server after adding variables

### Cannot login/signup
- Check Supabase project is active
- Verify API keys are correct
- Check email confirmation settings in Supabase Auth

### Data not showing
- Verify RLS policies are created (run schema SQL again)
- Check browser console for errors
- Ensure you're logged in with correct account

### Database errors
- Re-run the `supabase-schema.sql` file
- Check Supabase dashboard for error logs

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check browser console for errors

## 📄 License

This project is for personal/commercial use by the owner.

## 🙏 Acknowledgments

- Built with React and Vite
- Powered by Supabase
- Icons by Lucide
- Charts by Recharts

---

**Note**: This application is designed specifically for e-commerce sellers in India. It follows Indian accounting standards and GST compliance requirements.

## 🔄 Future Enhancements (Roadmap)

- [ ] Mobile app (React Native)
- [ ] Inventory management with stock levels
- [ ] Purchase and sales orders
- [ ] Multi-currency support
- [ ] Bank reconciliation
- [ ] GST filing reports (GSTR-1, GSTR-3B)
- [ ] Invoice generation
- [ ] Customer and supplier management
- [ ] Payment reminders
- [ ] Backup and restore functionality

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-09
