# 📅 Financial Year (FY) Selection Feature

## ✅ What's New

### **1. FY 2025-26 Added** ✓
Now supports 4 financial years:
- **2025-26** (NEW! Apr 2025 - Mar 2026)
- **2024-25** (Apr 2024 - Mar 2025)
- **2023-24** (Apr 2023 - Mar 2024)
- **2022-23** (Apr 2022 - Mar 2023)

### **2. Global FY Selector** ✓
- Located in **top right corner** below username
- Click "FY 2024-25" to open dropdown
- Select any financial year
- Choice saved automatically

### **3. Dynamic Dashboard Data** ✓
- Dashboard shows data for **selected FY only**
- All metrics filtered by FY:
  - Total Sales
  - Total Purchases
  - Total Expenses
  - Net Profit
  - Monthly charts
  - Platform sales

### **4. Reports by FY** ✓
- Reports page uses selected FY
- All reports filtered automatically
- Export PDF shows correct FY

## 📍 Where to Find FY Selector

### **Dashboard (Top Right)**
```
┌─────────────────────────────┐
│  Dashboard                  │
│                  Madhuri    │ ← Username
│                  FY 2024-25 ▼│ ← Click here!
└─────────────────────────────┘
```

### **Dropdown Menu**
```
┌──────────────┐
│ FY 2025-26   │ ← NEW!
│ FY 2024-25   │ ✓ Selected
│ FY 2023-24   │
│ FY 2022-23   │
└──────────────┘
```

## 🔄 How It Works

### **Example: Switch to FY 2025-26**

**Step 1:** Click "FY 2024-25" in top right
**Step 2:** Select "FY 2025-26" from dropdown
**Step 3:** Dashboard refreshes with 2025-26 data

**What Changes:**
- ✅ Total Sales: Shows Apr 2025 - Mar 2026 sales
- ✅ Total Purchases: Shows Apr 2025 - Mar 2026 purchases
- ✅ Monthly charts: Shows 2025-26 months
- ✅ Reports: All filtered to 2025-26

### **Example: Compare Years**

**View FY 2024-25:**
```
Dashboard:
- Total Sales: ₹5,00,000
- Net Profit: ₹1,50,000
```

**Switch to FY 2023-24:**
```
Dashboard:
- Total Sales: ₹3,50,000
- Net Profit: ₹1,00,000
```

Easy year-over-year comparison!

## 📊 What Gets Filtered

### **Dashboard**
- ✅ Total Sales (sum of all sales in FY)
- ✅ Total Purchases (sum of all purchases in FY)
- ✅ Total Expenses (sum of all expenses in FY)
- ✅ Net Profit calculation
- ✅ Monthly Sales & Purchases chart
- ✅ Platform-wise Sales chart
- ✅ Profit Trend chart

### **Reports Page**
- ✅ Profit & Loss Statement
- ✅ Balance Sheet
- ✅ Cash Flow Statement
- ✅ All exports (PDF)

### **What Doesn't Change**
- ❌ Assets (shows all current assets)
- ❌ Inventory (shows current stock)
- ❌ Settings

## 🎯 Use Cases

### **Use Case 1: Year-End Review**
```
End of FY 2024-25 (March 2025):
1. Select FY 2024-25
2. View dashboard metrics
3. Export reports for filing
4. Compare with FY 2023-24
```

### **Use Case 2: Planning New Year**
```
Start of FY 2025-26 (April 2025):
1. Select FY 2025-26
2. Dashboard starts fresh (₹0)
3. Add new transactions
4. Track throughout year
```

### **Use Case 3: Historical Analysis**
```
Need to check old data:
1. Select FY 2022-23
2. View old transactions
3. Export report
4. Switch back to current FY
```

### **Use Case 4: Tax Filing**
```
Filing for FY 2023-24:
1. Select FY 2023-24
2. Go to Reports
3. Generate P&L Statement
4. Export PDF
5. Submit to CA
```

## 📱 Auto-Detection

### **Initial FY**
When you first login:
- **Current month Apr-Dec** → Sets current FY (2024-25)
- **Current month Jan-Mar** → Sets previous FY (2023-24)

Example:
- Login in **October 2024** → Auto-selects FY 2024-25
- Login in **February 2025** → Auto-selects FY 2024-25

### **Persistence**
Your selected FY is **saved**:
- Refresh page → Same FY
- Close browser → Same FY
- Return later → Same FY
- Only changes when you select different FY

## 🔍 Technical Details

### **Date Ranges**
```
FY 2025-26: 2025-04-01 to 2026-03-31
FY 2024-25: 2024-04-01 to 2025-03-31
FY 2023-24: 2023-04-01 to 2024-03-31
FY 2022-23: 2022-04-01 to 2023-03-31
```

### **Data Filtering**
All queries use:
```sql
WHERE date >= 'FY_START' AND date <= 'FY_END'
```

### **Global State**
- Stored in: Zustand store
- Persisted in: localStorage
- Synced across: All pages

## 🎨 Visual Indicators

### **Selected FY**
- **Top Right:** Shows current FY (e.g., "FY 2024-25")
- **Dropdown:** Highlighted in purple
- **Reports:** Shows in header

### **Dropdown States**
- **Closed:** Shows selected FY + dropdown arrow
- **Open:** Shows all 4 FYs
- **Hover:** Highlights option
- **Selected:** Purple background

## ✅ Benefits

### **For Business Owners**
- ✅ Track performance year-by-year
- ✅ Easy year-end reviews
- ✅ Quick access to any FY
- ✅ Compare trends

### **For Accountants**
- ✅ Generate FY-specific reports
- ✅ Export correct data for filing
- ✅ Historical data access
- ✅ Accurate tax calculations

### **For Planning**
- ✅ Analyze past performance
- ✅ Set future targets
- ✅ Identify trends
- ✅ Make informed decisions

## 🛠️ Setup

### **No Setup Required!**
The feature is **ready to use**:
1. Refresh your browser
2. See FY selector in top right
3. Click and select FY
4. Dashboard updates automatically

### **If Not Showing**
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Restart dev server: `npm run dev`

## 📋 Quick Reference

### **Change FY**
```
1. Click "FY 2024-25" (top right)
2. Select desired FY from dropdown
3. Data refreshes automatically
```

### **View Different Years**
```
FY 2025-26 → Future/current year
FY 2024-25 → Current year (default)
FY 2023-24 → Last year
FY 2022-23 → Two years ago
```

### **Export Reports**
```
1. Select FY
2. Go to Reports page
3. Choose report type
4. Click "Export PDF"
5. PDF has correct FY data
```

## 🎓 Best Practices

### **Start of New FY**
```
April 1st:
1. Switch to new FY (e.g., 2025-26)
2. Verify previous FY reports
3. Start entering new transactions
4. Keep historical data intact
```

### **Year-End**
```
March 31st:
1. Ensure all entries complete
2. Generate all reports
3. Export PDFs
4. Back up data
5. Switch to new FY on Apr 1st
```

### **Regular Usage**
```
Daily/Weekly:
- Work in current FY
- Add transactions normally
- Review dashboard

Monthly:
- Check monthly trends
- Compare with previous months

Quarterly:
- Review quarterly performance
- Plan next quarter
```

## 🚀 Future Enhancements

Potential additions:
- ❑ FY comparison view (side-by-side)
- ❑ Multi-year charts
- ❑ FY-to-date vs full FY comparison
- ❑ Budget vs actual (by FY)
- ❑ Custom date ranges

---

## ✨ Summary

**Financial Year Feature Complete!**

- ✅ **4 FYs Available** (2025-26, 2024-25, 2023-24, 2022-23)
- ✅ **Global Selector** (Top right, below username)
- ✅ **Auto-Filtering** (Dashboard + Reports)
- ✅ **Persistent** (Saved in browser)
- ✅ **Easy Switching** (One click)

**Ready to track your business year-by-year!** 📅📊

---

**Questions?**
Check the FY selector in top right corner → Click → Select any year!
