# 📊 Sales Enhancements - Feature Guide

## New Features Added

### 1. **GST Inclusive Pricing** ✅
- Toggle to mark if selling price already includes GST
- Auto-extracts GST component from total
- Perfect for retail pricing where GST is included

### 2. **Platform Commission Tracking** 💰
- Track amount received after platform commission
- Calculate platform fees automatically
- Know your actual earnings

### 3. **Cost & Profit Tracking** 📈
- Enter cost price of product
- Auto-calculate profit amount
- See profit margin percentage

### 4. **Sales Returns** 🔄
- Separate page for recording returns
- Link to original sale
- Track refund amounts

## How It Works

### Example: Meesho Sale

**Scenario:**
- Customer pays: ₹1,180 (including 18% GST)
- Meesho deducts 15% commission
- Your cost: ₹800

**Entry Method 1: GST Inclusive (Recommended for online platforms)**

```
Product: Designer Gown
Quantity: 1
Selling Price: ₹1,180
☑️ GST Inclusive (18%)
Platform: Meesho
Amount Received: ₹1,003 (1,180 - 15% commission)
Cost Price: ₹800

Auto-Calculated:
├─ Base Amount: ₹1,000 (1,180 ÷ 1.18)
├─ GST (18%): ₹180
├─ Platform Commission: ₹177 (15% of 1,180)
├─ Amount Received: ₹1,003
└─ Profit: ₹203 (1,003 - 800)
```

**Entry Method 2: GST Exclusive (Traditional)**

```
Product: Designer Gown  
Quantity: 1
Unit Price: ₹1,000
☐ GST Inclusive
GST %: 18%
Cost Price: ₹800
Amount Received: ₹1,003

Auto-Calculated:
├─ Base Amount: ₹1,000
├─ GST (18%): ₹180
├─ Total: ₹1,180
├─ Platform Commission: ₹177
└─ Profit: ₹203
```

## Field Explanations

### **Unit Price / Selling Price**
- If GST Inclusive: Enter the total price customer pays
- If GST Exclusive: Enter base price (GST will be added)

### **GST Inclusive Toggle**
- ✅ ON: Price includes GST (₹1,180 already has 18% GST in it)
- ☐ OFF: GST will be added to price (₹1,000 + 18% = ₹1,180)

### **GST Percentage**
- Select: 0%, 5%, 12%, 18%, 28%
- Used to extract/calculate GST component

### **Amount Received**
- Actual money credited to your account
- After platform commission, fees, deductions
- Leave blank if same as total (offline sales)

### **Cost Price**
- What you paid for the product
- Used to calculate profit
- Optional but recommended

### **Platform Commission**
- Auto-calculated if Amount Received < Total Amount
- Shows platform fees
- Helps track selling costs

### **Profit Amount**
- Auto-calculated: Amount Received - Cost Price
- Your actual earnings per sale

## Calculations

### When GST Inclusive is ON:
```
Base Amount = Unit Price ÷ (1 + GST%/100)
GST Amount = Base Amount × (GST%/100)
Total Amount = Unit Price (already includes GST)
```

Example: ₹1,180 with 18% GST
```
Base = 1,180 ÷ 1.18 = ₹1,000
GST = 1,000 × 0.18 = ₹180
Total = ₹1,180
```

### When GST Inclusive is OFF:
```
Base Amount = Unit Price × Quantity
GST Amount = Base × (GST%/100)
Total Amount = Base + GST
```

Example: ₹1,000 with 18% GST
```
Base = ₹1,000
GST = 1,000 × 0.18 = ₹180  
Total = ₹1,180
```

### Profit Calculation:
```
Platform Commission = Total - Amount Received
Profit = Amount Received - Cost Price
Margin % = (Profit ÷ Cost Price) × 100
```

## Use Cases

### **Use Case 1: Meesho Sale**
```
Customer Price: ₹1,180 (with GST)
✓ GST Inclusive: Yes
GST %: 18%
Meesho gives you: ₹1,003
Your cost: ₹800
Profit: ₹203 (20.3% margin)
```

### **Use Case 2: Amazon Sale**  
```
MRP: ₹1,500
✓ GST Inclusive: Yes
GST %: 18%
After Amazon fees: ₹1,200
Your cost: ₹900
Profit: ₹300 (33.3% margin)
```

### **Use Case 3: Offline Cash Sale**
```
Selling Price: ₹1,000
☐ GST Inclusive: No
GST %: 0% (no GST)
Amount Received: ₹1,000 (same as total)
Cost: ₹700
Profit: ₹300 (42.8% margin)
```

### **Use Case 4: Wholesale with GST**
```
Base Price: ₹800
☐ GST Inclusive: No
GST %: 12%
Total: ₹896
Paid in full: ₹896
Cost: ₹600
Profit: ₹296 (49.3% margin)
```

## Sales Returns

### Recording a Return
1. Go to **Sales Returns** page
2. Click "Add Return"
3. Optionally link to original sale
4. Enter returned product details
5. Specify refund amount
6. Add reason for return

### Return Entry Example:
```
Product: Gown (Size issue)
Original Sale: #12345
Return Date: 15-Jan-2025
Quantity: 1
Refund Amount: ₹1,180
Reason: Wrong size
```

### Impact on Reports:
- Returns reduce net sales
- Refunds reduce net profit
- GST on returns adjustable

## Setup Instructions

### 1. Run Database Migration
```sql
Run: supabase-sales-enhancements.sql in Supabase SQL Editor
```

This adds:
- GST inclusive field
- Cost price tracking
- Amount received field
- Platform commission calculation
- Profit tracking
- Sales returns table
- Purchase returns table

### 2. Update Application
```bash
Files updated:
- src/pages/Sales.jsx (enhanced form)
- New: src/pages/SalesReturns.jsx
- New: src/pages/PurchaseReturns.jsx
```

### 3. Restart App
```bash
npm run dev
```

## Best Practices

### **For Online Sellers:**
1. Always use GST Inclusive for platform sales
2. Enter actual amount received after commission
3. Track cost price for profit analysis
4. Record platform name for comparison

### **For Offline Sellers:**
1. Use GST Exclusive for B2B sales
2. Use 0% GST or GST Inclusive for retail
3. Amount received = Total (no commission)
4. Track payment method

### **For Mixed Sellers:**
1. Use appropriate mode per sale type
2. Compare platform profitability
3. Identify best-selling channels
4. Optimize pricing strategy

## Reports Impact

### Profit & Loss
```
Sales Revenue: ₹1,00,000
(-) Sales Returns: ₹5,000
Net Sales: ₹95,000

(-) Cost of Goods: ₹60,000
Gross Profit: ₹35,000 (36.8%)

(-) Platform Commission: ₹12,000
(-) Other Expenses: ₹8,000
Net Profit: ₹15,000 (15.8%)
```

### Platform Comparison
```
Platform    | Sales  | Commission | Profit | Margin
------------|--------|------------|--------|--------
Meesho      | 45,000 | 6,750      | 8,500  | 18.9%
Amazon      | 35,000 | 7,000      | 7,200  | 20.6%
Flipkart    | 20,000 | 3,200      | 4,800  | 24.0%
```

## Troubleshooting

**Q: Profit showing negative?**
A: Check if Amount Received < Cost Price. Verify commission rates.

**Q: GST calculation wrong?**
A: Ensure correct toggle (Inclusive vs Exclusive) is selected.

**Q: Amount Received not auto-filling?**
A: It stays empty for manual entry. Enter platform amount.

**Q: Can I edit old sales?**
A: Yes! Click edit and add cost/commission details.

---

**Now you have complete visibility into your online selling profitability!** 📊💰
