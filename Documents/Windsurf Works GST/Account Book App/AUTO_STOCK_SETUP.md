# 🔄 Auto Stock Update Feature

## ✅ What's New

### **Automatic Stock Reduction on Sales**
- When you make a sale, stock automatically reduces
- Matches by **Product Name** (case-insensitive)
- Creates stock movement record for audit

### **Automatic Stock Increase on Purchases**
- When you purchase items, stock automatically increases
- Matches purchase `item_name` to inventory `product_name`
- Tracks all movements

### **2 Decimal Precision**
- All amounts rounded to exactly 2 decimal places
- Consistent display throughout sales

## 🔧 Setup Instructions

### Step 1: Run Auto-Stock SQL Migration

Go to **Supabase → SQL Editor**:

1. Open file: `supabase-auto-stock-update.sql`
2. Copy ALL the SQL
3. Paste in SQL Editor
4. Click **RUN**

This creates:
- ✅ Auto-update trigger on sales
- ✅ Auto-update trigger on purchases
- ✅ Stock movement logging
- ✅ Handles INSERT, UPDATE, DELETE

### Step 2: Refresh Browser

Just refresh your app to see 2 decimal precision!

## 📦 How It Works

### Example Flow:

#### **1. Add Product to Inventory**
```
Product Name: Single Batik
Opening Stock: 10
```

#### **2. Make a Sale**
```
Product Name: Single Batik  (exact match!)
Quantity: 2
```

**Auto-Happens:**
- ✅ Inventory stock: 10 → 8
- ✅ Stock movement logged: "OUT - 2 units - SALE"
- ✅ Reference saved to sale

#### **3. Purchase More**
```
Item Name: Single Batik
Quantity: 5
```

**Auto-Happens:**
- ✅ Inventory stock: 8 → 13
- ✅ Stock movement logged: "IN - 5 units - PURCHASE"

#### **4. Delete Sale**
```
Delete the sale of 2 units
```

**Auto-Happens:**
- ✅ Inventory stock: 13 → 15 (restored!)
- ✅ Movement logged: "Stock restored"

## ⚙️ Matching Logic

### Product Name Matching:
- **Case-insensitive**: "Single Batik" = "single batik" = "SINGLE BATIK"
- **Trimmed**: Ignores leading/trailing spaces
- **Exact match**: Must match exactly (after trim and lowercase)

### Important:
**Use the EXACT same product name in:**
1. Inventory (Product Name)
2. Sales (Product Name)
3. Purchases (Item Name)

Example: If inventory has "Single Batik", use "Single Batik" in sales too!

## 📊 Stock Movement History

All automatic updates are logged in `stock_movements` table:

```
Date       | Product      | Type | Qty | Reference    | Notes
-----------|--------------|------|-----|--------------|------------------
10-Jan-25  | Single Batik | OUT  | 2   | SALE #123    | Auto-deducted
10-Jan-25  | Single Batik | IN   | 5   | PURCHASE #45 | Auto-added
```

## 🎯 Use Cases

### **Use Case 1: Daily Sales**
```
Morning Stock: 10 units of "Designer Gown Red"

Sales during day:
- Sale 1: 2 units → Stock: 8
- Sale 2: 1 unit → Stock: 7
- Sale 3: 3 units → Stock: 4

Evening Stock: 4 units (all automatic!)
```

### **Use Case 2: Sale Correction**
```
Original Sale: 5 units
Edit to: 3 units

Auto-Happens:
- Stock increased by 2 (5-3)
- Movement logged
```

### **Use Case 3: Sale Cancellation**
```
Sale: 2 units
Delete Sale

Auto-Happens:
- Stock restored: +2
- Movement: "Sale deleted - stock restored"
```

### **Use Case 4: New Stock Arrival**
```
Purchase: 10 units of "Single Batik"

Auto-Happens:
- Inventory +10
- Movement logged
```

## ⚠️ Important Notes

### **1. Product Names Must Match**
```
✅ CORRECT:
Inventory: "Single Batik"
Sale: "Single Batik"
→ Stock updates automatically

❌ WRONG:
Inventory: "Single Batik"
Sale: "Batik Single"
→ No match, no auto-update
```

### **2. Product Must Exist in Inventory**
```
If product not in inventory → No auto-update
Add to inventory first!
```

### **3. Manual Adjustments Still Work**
```
You can still use "Stock Adjustment" feature
Both auto and manual adjustments are logged
```

### **4. Negative Stock Allowed**
```
If stock goes negative, you'll see negative number
Add a validation if you want to prevent this
```

## 🔍 Verification

### Check if Working:

1. **Before Sale:**
   - Go to Inventory
   - Note current stock (e.g., 10)

2. **Make Sale:**
   - Product: Same name as inventory
   - Quantity: 2

3. **Check Inventory:**
   - Refresh Inventory page
   - Stock should be 8 now!

4. **Check Movement Log:**
   - Look in `stock_movements` table in Supabase
   - Should see "OUT" entry

## 📈 Benefits

### **For You:**
- ✅ No manual stock updates needed
- ✅ Always accurate stock levels
- ✅ Complete audit trail
- ✅ Know when to reorder
- ✅ Prevent overselling

### **For Business:**
- ✅ Real-time inventory
- ✅ Better planning
- ✅ Reduce stockouts
- ✅ Track product movement
- ✅ Historical data

## 🛠️ Troubleshooting

### **Stock not updating?**

**Check:**
1. Product name exact match? (case doesn't matter)
2. Product exists in inventory?
3. Trigger enabled in Supabase?
4. Browser console for errors?

**Solution:**
- Verify product names match exactly
- Add product to inventory first
- Re-run auto-stock SQL if needed

### **Stock went negative?**

**Cause:** Sold more than available

**Solution:**
- Use "Stock Adjustment" to correct
- Check if sale quantity is correct
- Verify opening stock was right

### **Old sales not updating stock?**

**Why:** Trigger only works for new sales after setup

**Solution:**
- Old sales won't affect stock
- Start fresh from today
- Or manually adjust opening stock

## 📋 Migration Checklist

Before enabling auto-stock:

- [ ] Run `supabase-sales-enhancements.sql`
- [ ] Run `supabase-inventory-schema.sql`
- [ ] Run `supabase-auto-stock-update.sql`
- [ ] Add all products to inventory
- [ ] Verify product names match
- [ ] Set correct opening stock
- [ ] Test with one sale
- [ ] Check stock updated
- [ ] Verify movement logged

## 🎓 Best Practices

### **1. Standardize Product Names**
```
Use consistent naming:
- "Designer Gown - Red"
- "Designer Gown - Blue"
- "Cotton Saree - Green"
```

### **2. Add Products Before Sales**
```
Always create inventory entry first
Then sales will auto-update
```

### **3. Regular Stock Checks**
```
Weekly: Physical count vs system
Monthly: Check movement history
Quarterly: Verify accuracy
```

### **4. Use Product Codes**
```
Add unique codes in inventory:
DG-RED-001, DG-BLUE-001
Helps identify similar products
```

## 🔐 Security

- ✅ User-specific updates (can't affect other users)
- ✅ RLS policies enforced
- ✅ Audit trail maintained
- ✅ Rollback possible (delete sale → stock restored)

---

## 🚀 You're Ready!

**After running the SQL:**
1. Add products to inventory
2. Make a sale with matching product name
3. Check inventory - stock should reduce automatically!
4. Enjoy automated stock management! 📦✨

**Questions?**
Check the movement history in `stock_movements` table to see all automatic updates.
