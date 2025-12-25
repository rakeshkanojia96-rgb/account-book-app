# 💼 Selling Expenses Feature

## ✅ What's New

Track **direct expenses** for each sale to calculate **true net profit**!

### **Selling Expenses Include:**
- 📦 Packing materials (bubble wrap, boxes, tape)
- 🚚 Transport/Shipping/Courier charges
- 💳 Platform commission (if not auto-calculated)
- 💰 Payment gateway fees
- 📢 Marketing/Ads specific to this sale
- 🎁 Commission to agents
- 📋 Any other direct cost to complete the sale

## 🎯 Why Track Selling Expenses?

### **Problem:**
```
Sale: ₹1,000
Cost: ₹600
Profit shown: ₹400 ❌

But you spent:
- Packing: ₹30
- Courier: ₹70
Total expense: ₹100

Real profit: ₹300 (not ₹400!)
```

### **Solution:**
With selling expenses tracked:
```
Sale: ₹1,000
Cost: ₹600
Selling Expense: ₹100 (Packing + Courier)
━━━━━━━━━━━━━━━━━━━━━━━
Net Profit: ₹300 ✅
```

## 📊 How It Works

### **1. During Sale Entry**

After entering cost and amount received, add:

#### **Expense Category** (Dropdown)
Select from predefined categories:
- Packing Material
- Packaging Cost
- Transport/Shipping
- Courier Charges
- Platform Commission
- Payment Gateway
- Marketing/Ads
- Commission
- Other Selling Expense

#### **Expense Amount** (₹)
Enter total expense amount for this sale

#### **Expense Notes** (Optional)
Add details: "Bubble wrap ₹20 + Courier ₹70"

### **2. Auto-Calculate Net Profit**

**Formula:**
```
Net Profit = Amount Received - Cost - Selling Expense - GST
```

**Example:**
```
Product: Designer Gown
Selling Price: ₹1,180 (GST Inclusive)
✓ GST Inclusive: Yes (18%)
Amount Received: ₹1,003 (after platform commission)
Cost Price: ₹600
Selling Expense: ₹100 (Packing ₹30 + Courier ₹70)

Calculation:
├─ Base Amount: ₹1,000 (GST extracted)
├─ GST (18%): ₹180
├─ Total: ₹1,180
├─ (-) Commission: ₹177 (₹1,180 - ₹1,003)
├─ Amount Received: ₹1,003
├─ (-) Cost: ₹600
├─ (-) Selling Expense: ₹100
└─ Net Profit: ₹303 ✅
```

## 🔄 Complete Flow Example

### **Example 1: Meesho Sale**

**Product:** Single Batik
**MRP:** ₹700
**GST:** 5% (included in MRP)
**Meesho Settlement:** ₹595 (15% commission)
**Your Cost:** ₹400
**Packing:** ₹25
**Courier:** ₹50

**Entry:**
```
Selling Price: ₹700
✓ GST Inclusive
GST %: 5%
Amount Received: ₹595
Cost Price: ₹400
Selling Expense Category: Packing Material
Selling Expense Amount: ₹75
Selling Expense Notes: Bubble wrap ₹25 + Courier ₹50
```

**Result:**
```
Base Amount: ₹666.67
GST (5%): ₹33.33
Total: ₹700.00
(-) Platform Commission: ₹105.00
Amount Received: ₹595.00
(-) Cost: ₹400.00
(-) Selling Expense (Packing Material): ₹75.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Net Profit: ₹120.00 ✅
```

### **Example 2: Local Sale (No Expense)**

**Product:** Saree
**Price:** ₹2,000 (no GST)
**Cost:** ₹1,200
**No packing/transport needed**

**Entry:**
```
Selling Price: ₹2,000
☐ GST Inclusive (unchecked)
GST %: 0%
Cost Price: ₹1,200
Selling Expense: (leave at 0)
```

**Result:**
```
Base Amount: ₹2,000.00
GST: ₹0.00
Total: ₹2,000.00
Amount Received: ₹2,000.00
(-) Cost: ₹1,200.00
(-) Selling Expense: ₹0.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Net Profit: ₹800.00 ✅
```

### **Example 3: Multiple Expenses**

**Product:** Designer Lehenga
**Price:** ₹5,000
**Settlement:** ₹4,250
**Cost:** ₹3,000
**Expenses:**
- Professional packing: ₹150
- Courier (COD): ₹120
- COD charges: ₹30

**Entry:**
```
Selling Price: ₹5,000
Amount Received: ₹4,250
Cost Price: ₹3,000
Selling Expense Category: Courier Charges
Selling Expense Amount: ₹300
Selling Expense Notes: Packing ₹150 + Courier ₹120 + COD ₹30
```

**Result:**
```
Amount Received: ₹4,250.00
(-) Cost: ₹3,000.00
(-) Selling Expense (Courier Charges): ₹300.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Net Profit: ₹950.00 ✅
```

## 📈 Benefits

### **Accurate Profitability**
- ✅ See **true net profit** per sale
- ✅ Include all costs (product + selling)
- ✅ Make informed pricing decisions

### **Expense Categorization**
- ✅ Track which expenses are highest
- ✅ Identify cost-saving opportunities
- ✅ Proper accounting for tax purposes

### **Better Pricing**
- ✅ Know minimum selling price
- ✅ Factor in all costs
- ✅ Set profitable margins

### **Reporting**
- ✅ Selling expenses linked to categories
- ✅ Separate from regular expenses
- ✅ Sale-specific expense tracking

## 🎯 Use Cases

### **Use Case 1: Reduce Packing Costs**

**Track packing expenses:**
```
Sale 1: Packing ₹50
Sale 2: Packing ₹45
Sale 3: Packing ₹60
Average: ₹52 per sale
```

**Action:** Buy in bulk, reduce to ₹30 per sale
**Result:** Save ₹22 per sale = Higher profit!

### **Use Case 2: Negotiate Courier Rates**

**Current data:**
```
Month expenses:
- Courier: ₹3,500 (50 shipments)
- Average: ₹70 per shipment
```

**Action:** Negotiate bulk rates
**New rate:** ₹50 per shipment
**Savings:** ₹1,000/month!

### **Use Case 3: Price Optimization**

**Product profitability:**
```
Product A:
- Selling Price: ₹1,000
- Cost: ₹600
- Selling Expense: ₹150
- Net Profit: ₹250 (25%)

Product B:
- Selling Price: ₹800
- Cost: ₹400
- Selling Expense: ₹50
- Net Profit: ₹350 (43.75%)
```

**Insight:** Product B more profitable!
**Action:** Focus on Product B

### **Use Case 4: Platform Comparison**

**Meesho:**
```
Sale: ₹1,000
Commission: ₹150
Packing: ₹30
Courier: ₹70
Total Expense: ₹250
Net: ₹750 - Cost
```

**Amazon:**
```
Sale: ₹1,000
Commission: ₹200
Packing: ₹30
Courier: ₹0 (fulfilled by Amazon)
Total Expense: ₹230
Net: ₹770 - Cost
```

**Insight:** Amazon better despite higher commission!

## 📋 Expense Categories Explained

### **Packing Material**
- Bubble wrap, boxes, tape
- Packaging paper, poly bags
- Labels, stickers

### **Packaging Cost**
- Professional packing service
- Gift wrapping
- Custom packaging

### **Transport/Shipping**
- Local transport to courier
- Shipping charges
- Handling fees

### **Courier Charges**
- Courier service fees
- COD charges
- Insurance (if any)

### **Platform Commission**
- If not auto-calculated
- Additional platform fees
- Listing fees

### **Payment Gateway**
- Payment processing fees
- Transaction charges
- Gateway commission

### **Marketing/Ads**
- Product-specific ads
- Promotion costs
- Influencer commission

### **Commission**
- Agent commission
- Referral fees
- Finder's fee

### **Other Selling Expense**
- Any other direct cost
- Miscellaneous expenses

## 🔧 Setup Required

### **Run SQL Migration:**

File: `supabase-sales-expenses-link.sql`

**What it adds:**
- ✅ `selling_expense_amount` column
- ✅ `selling_expense_category` column
- ✅ `selling_expense_notes` column
- ✅ `expense_categories` table
- ✅ Default expense categories

**Steps:**
1. Go to Supabase → SQL Editor
2. Copy content from `supabase-sales-expenses-link.sql`
3. Paste and **RUN**
4. Refresh your app

## 💡 Tips & Best Practices

### **1. Be Consistent**
- Always track packing expenses
- Record all courier charges
- Don't skip small expenses

### **2. Use Notes Effectively**
```
Good: "Bubble wrap ₹20 + Box ₹10 + Courier ₹50"
Bad: "Packing"
```

### **3. Category Selection**
- Choose most relevant category
- Helps in expense reports
- Easier to analyze

### **4. Bulk Entry**
If same expense for multiple sales:
- Note the expense amount
- Add to each sale
- Total will be accurate

### **5. Review Regularly**
- Check expense trends monthly
- Identify cost-saving areas
- Optimize operations

## 📊 Reports Impact

### **Profit & Loss Statement**
Selling expenses will show:
- ✅ Under "Selling Expenses" category
- ✅ Separate from regular expenses
- ✅ Linked to specific sales

### **Net Profit Calculation**
```
Revenue (Sales)
(-) Cost of Goods Sold
(-) Selling Expenses ← New!
(-) Operating Expenses
━━━━━━━━━━━━━━━━━━━━━
Net Profit
```

### **Sale-wise Profitability**
Each sale shows:
- Gross revenue
- Cost
- Selling expense
- Net profit

## ⚠️ Important Notes

### **Selling Expenses vs Regular Expenses**

**Selling Expenses** (linked to sales):
- Direct cost of THIS sale
- Packing, courier for THIS order
- Tracked per transaction

**Regular Expenses** (general):
- Rent, electricity, salaries
- Marketing campaigns (general)
- Not linked to specific sale

### **GST on Expenses**

GST paid on selling expenses:
- Track separately in expense notes
- Can be claimed as input tax credit
- Consult your CA for tax filing

### **Optional Field**

Selling expenses are **optional**:
- If no expense, leave blank
- Profit = Revenue - Cost
- Add only when applicable

## 🚀 Quick Reference

### **Add Selling Expense:**
```
1. Open/Edit Sale
2. Scroll to "Selling Expenses" section
3. Select Category (dropdown)
4. Enter Amount
5. Add Notes (optional)
6. Save
```

### **View Impact:**
Check the summary:
```
Amount Received: ₹1,003
(-) Cost: ₹600
(-) Selling Expense (Packing): ₹75
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Net Profit: ₹328 ✅
```

---

## ✨ Summary

**Selling Expenses Feature:**
- ✅ **Track** direct sale costs
- ✅ **Categorize** expenses properly
- ✅ **Calculate** true net profit
- ✅ **Analyze** cost patterns
- ✅ **Optimize** profitability

**Formula:**
```
Net Profit = Revenue - Cost - Selling Expenses
```

**Run SQL migration to activate!** 📊💼
