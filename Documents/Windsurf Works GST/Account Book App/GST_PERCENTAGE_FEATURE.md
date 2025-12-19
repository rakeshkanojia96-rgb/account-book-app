# GST Percentage Feature

## 📊 What's New?

You can now customize GST percentage for each transaction! This is useful for:
- **No GST transactions** (0%)
- **Different GST slabs** (5%, 12%, 18%, 28%)
- **Mixed transactions** (some with GST, some without)

## 🎯 Where It Works

### ✅ Sales Transactions
- Meesho, Amazon, Flipkart sales
- Offline sales
- Each sale can have different GST %

### ✅ Purchase Transactions
- Raw materials
- Packing materials
- Inventory purchases
- Assets (Computer, Printer, etc.)

### ✅ Asset Purchases
- Equipment
- Furniture
- Vehicles
- Any capital asset

## 📝 How to Use

### Adding a Sale/Purchase/Asset:

1. Click "Add Sale" / "Add Purchase" / "Add Asset"
2. Fill in the normal details (date, product, quantity, price)
3. **Select GST %** from dropdown:
   - **0% (No GST)** - For non-GST transactions
   - **5%** - Essential goods (sugar, tea, etc.)
   - **12%** - Standard items
   - **18% (Standard)** - Default, most items
   - **28%** - Luxury items
4. GST amount and total automatically calculated
5. Submit!

## 💡 Examples

### Example 1: Sale WITH GST
```
Product: Designer Gown
Quantity: 1
Unit Price: ₹1,000
GST %: 18% (Standard)
-----------------
Base Amount: ₹1,000
GST (18%): ₹180
Total: ₹1,180
```

### Example 2: Sale WITHOUT GST
```
Product: Cotton Gown (Small seller exempt)
Quantity: 2
Unit Price: ₹500
GST %: 0% (No GST)
-----------------
Base Amount: ₹1,000
GST (0%): ₹0
Total: ₹1,000
```

### Example 3: Asset Purchase
```
Asset: Computer
Purchase Price: ₹50,000
GST %: 18%
-----------------
Purchase Price: ₹50,000
GST (18%): ₹9,000
Total Cost: ₹59,000
```

## 🔄 Updating Database

**IMPORTANT**: You need to run the migration SQL to add this feature to your database.

### Steps:

1. Go to Supabase dashboard
2. Click **SQL Editor**
3. Open file: `supabase-migration-gst-percentage.sql`
4. Copy ALL the SQL code
5. Paste in Supabase SQL Editor
6. Click **RUN**

This will:
- ✅ Add `gst_percentage` column to sales, purchases, assets
- ✅ Set default to 18% for all existing records
- ✅ Calculate total cost for existing assets

## 📊 Impact on Reports

### Profit & Loss Statement
- Revenue includes actual GST collected
- Expenses include actual GST paid
- Net profit reflects real GST impact

### Balance Sheet
- Assets shown at total cost (including GST paid)
- More accurate asset valuation

### GST Reports (Future)
- Track GST input (paid on purchases)
- Track GST output (collected on sales)
- Calculate GST liability

## 🎨 UI Features

- **Dropdown Selection** - Easy to choose GST %
- **Auto-calculation** - Amount updates instantly
- **Summary Box** - Shows base amount, GST, total
- **Editable** - Can change GST % when editing entries

## ⚙️ Default Behavior

- **Default GST**: 18% (most common in India)
- **Can be changed** to 0%, 5%, 12%, or 28%
- **Saved per transaction** - Each entry can have different GST

## 💼 Business Scenarios

### When to Use 0% (No GST):
- You're a small seller under GST exemption limit
- Selling to unregistered buyers
- Agricultural products (some cases)
- Exports (zero-rated)

### When to Use 5%:
- Essential goods
- Specific items in GST Act

### When to Use 12%:
- Most processed foods
- Standard consumer goods

### When to Use 18%:
- Default for most services and goods
- Electronics, textiles (many cases)

### When to Use 28%:
- Luxury items
- Certain high-end goods

## 📞 Questions?

- **Q: Do I need to update all old entries?**
  - A: No! They'll automatically get 18% as default
  
- **Q: Can I mix GST and non-GST sales?**
  - A: Yes! Each transaction is independent
  
- **Q: Will this affect my reports?**
  - A: Yes, but positively! More accurate profit calculations

- **Q: What if I sell both GST and non-GST items?**
  - A: Perfect! Just select the right GST % for each sale

---

**Remember**: Run the migration SQL first, then restart your app to use this feature! 🚀
