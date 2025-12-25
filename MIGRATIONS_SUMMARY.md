# 🗄️ Database Migrations Summary

## 📋 Pending Migrations (Run in Order)

You have **3 SQL files** to run in Supabase to activate all new features.

---

## 1️⃣ Sales Enhancements (REQUIRED)

**File:** `supabase-sales-enhancements.sql`

### **Adds:**
- ✅ GST Inclusive toggle
- ✅ Cost price tracking
- ✅ Amount received field
- ✅ Platform commission auto-calculation
- ✅ Profit amount calculation
- ✅ Sales returns table
- ✅ Purchase returns table

### **Features Enabled:**
- Track if price includes GST
- Calculate profit per sale
- See platform commission impact
- Handle returns properly

**Status:** ⏳ Pending

---

## 2️⃣ Auto Stock Updates (REQUIRED)

**File:** `supabase-auto-stock-update.sql`

### **Adds:**
- ✅ Auto-reduce stock on sales
- ✅ Auto-increase stock on purchases
- ✅ Auto-adjust on sales returns
- ✅ Auto-adjust on purchase returns
- ✅ Complete stock movement logging

### **Features Enabled:**
- Inventory updates automatically
- No manual stock adjustments
- Full audit trail
- Returns handled properly

**Status:** ⏳ Pending

---

## 3️⃣ Selling Expenses (NEW - REQUIRED)

**File:** `supabase-sales-expenses-link.sql`

### **Adds:**
- ✅ Selling expense amount field
- ✅ Selling expense category field
- ✅ Selling expense notes field
- ✅ Expense categories table
- ✅ Default selling expense categories

### **Features Enabled:**
- Track packing costs per sale
- Track transport/courier charges
- Link expenses to sales
- Calculate true net profit

**Default Categories:**
- Packing Material
- Packaging Cost
- Transport/Shipping
- Courier Charges
- Platform Commission
- Payment Gateway
- Marketing/Ads
- Commission
- Other Selling Expense

**Status:** ⏳ Pending

---

## 🚀 How to Run All Migrations

### **Step-by-Step:**

#### **1. Open Supabase Dashboard**
```
1. Go to your Supabase project
2. Click "SQL Editor" in left menu
3. Click "New Query"
```

#### **2. Run Migration #1**
```
1. Open file: supabase-sales-enhancements.sql
2. Copy ALL content (Ctrl+A, Ctrl+C)
3. Paste in SQL Editor
4. Click "RUN" button (bottom right)
5. Wait for "Success" message
```

#### **3. Run Migration #2**
```
1. Open file: supabase-auto-stock-update.sql
2. Copy ALL content
3. Paste in SQL Editor (New Query)
4. Click "RUN"
5. Wait for "Success"
```

#### **4. Run Migration #3**
```
1. Open file: supabase-sales-expenses-link.sql
2. Copy ALL content
3. Paste in SQL Editor (New Query)
4. Click "RUN"
5. Wait for "Success"
```

#### **5. Verify**
```
Check these tables exist:
✓ sales (with new columns)
✓ sales_returns
✓ purchase_returns
✓ expense_categories
✓ inventory
✓ stock_movements
```

---

## 📊 What Each Migration Enables

### **Before Migrations:**
```
Sales Entry:
- Product
- Price
- Quantity
- GST %
- Total

Profit = Price - Nothing ❌
Stock = Manual updates only ❌
Expenses = Separate tracking ❌
```

### **After All 3 Migrations:**
```
Sales Entry:
- Product
- Price (GST inclusive/exclusive)
- Quantity
- GST %
- Cost Price
- Amount Received
- Selling Expenses (category + amount)

Auto-calculated:
✅ GST extracted correctly
✅ Platform commission
✅ True net profit
✅ Stock auto-updated

Profit = Revenue - Cost - Expenses ✅
Stock = Updates automatically ✅
Expenses = Linked to sales ✅
```

---

## 🎯 Feature Dependency

### **Migration Order Matters:**

```
Migration #1 (Sales Enhancements)
    ↓
    Required for: Cost tracking, profit calculation
    
Migration #2 (Auto Stock Updates)
    ↓
    Depends on: Inventory schema (already done)
    
Migration #3 (Selling Expenses)
    ↓
    Depends on: Migration #1 (sales table)
    Adds: Expense tracking to profit calculation
```

---

## ✅ After Running Migrations

### **1. Restart Your App**
```bash
# Stop dev server (Ctrl+C)
npm run dev
```

### **2. Test New Features**

#### **Test GST Inclusive:**
```
1. Add Sale
2. Check "✓ GST Inclusive"
3. Enter selling price
4. See GST extracted automatically
```

#### **Test Profit Calculation:**
```
1. Add Sale
2. Enter Cost Price: ₹500
3. Enter Amount Received: ₹800
4. See Profit: ₹300
```

#### **Test Selling Expenses:**
```
1. Add Sale
2. Select Expense Category: "Packing Material"
3. Enter Expense Amount: ₹50
4. See Net Profit reduced by ₹50
```

#### **Test Auto Stock:**
```
1. Add product "Test" with stock: 10
2. Make sale: "Test" - Qty: 2
3. Check inventory: Stock should be 8
4. Check stock_movements: Entry logged
```

---

## 📋 Migration Checklist

### **Pre-Migration:**
- [ ] Backup your data (optional but recommended)
- [ ] Check Supabase is accessible
- [ ] Have all 3 SQL files ready

### **During Migration:**
- [ ] Run migration #1: `supabase-sales-enhancements.sql`
- [ ] Verify: No errors, success message
- [ ] Run migration #2: `supabase-auto-stock-update.sql`
- [ ] Verify: No errors, success message
- [ ] Run migration #3: `supabase-sales-expenses-link.sql`
- [ ] Verify: No errors, success message

### **Post-Migration:**
- [ ] Restart app (`npm run dev`)
- [ ] Test GST inclusive toggle
- [ ] Test profit calculation
- [ ] Test selling expenses
- [ ] Test auto stock updates
- [ ] Add products to inventory
- [ ] Make a test sale

---

## 🆘 Troubleshooting

### **Error: "column already exists"**
**Solution:** Migration already ran, skip it

### **Error: "table does not exist"**
**Solution:** Run migrations in order (1, 2, 3)

### **Error: "permission denied"**
**Solution:** Check you're logged into correct Supabase project

### **Features not showing**
**Solution:** 
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear cache
3. Restart dev server

### **Stock not updating**
**Solution:**
1. Check product name matches exactly
2. Verify migration #2 ran successfully
3. Check stock_movements table for errors

---

## 📚 Documentation

After running migrations, read:

1. **SELLING_EXPENSES_GUIDE.md** - How to use selling expenses
2. **SALES_ENHANCEMENTS_GUIDE.md** - GST inclusive & profit tracking
3. **STOCK_MOVEMENTS_COMPLETE.md** - Auto stock updates
4. **FINANCIAL_YEAR_FEATURE.md** - FY selection (no migration needed)

---

## ✨ Final Result

### **Complete Sales System:**

```
Sales Entry Form:
├─ Basic Info
│  ├─ Date, Invoice, Customer
│  ├─ Platform, Product, Quantity
│  └─ Payment Method
│
├─ Pricing
│  ├─ Unit Price / Selling Price
│  ├─ GST % (0%, 5%, 12%, 18%, 28%)
│  └─ ✓ GST Inclusive toggle
│
├─ Costs & Revenue
│  ├─ Cost Price (per unit)
│  └─ Amount Received (after commission)
│
├─ Selling Expenses 💼 NEW!
│  ├─ Expense Category (dropdown)
│  ├─ Expense Amount
│  └─ Expense Notes
│
└─ Auto-Calculated Summary
   ├─ Base Amount
   ├─ GST Amount
   ├─ Total Amount
   ├─ Platform Commission
   ├─ Amount Received
   ├─ (-) Cost
   ├─ (-) Selling Expense ← NEW!
   └─ Net Profit ✅
```

### **Auto Features:**
- ✅ Stock reduces on sale
- ✅ Stock increases on purchase
- ✅ Stock adjusts on returns
- ✅ All movements logged
- ✅ GST extracted correctly
- ✅ Commission calculated
- ✅ Profit calculated
- ✅ 2 decimal precision

---

## 🎉 You're Ready!

**After running all 3 migrations:**
1. Your app has complete sales tracking
2. Accurate profit calculation
3. Automatic inventory management
4. Proper expense categorization

**Start using:**
1. Add products to inventory
2. Make sales with all details
3. Track selling expenses
4. See true profitability!

**Questions?** Check the guide files! 📖
