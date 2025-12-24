-- Account Book App - Neon Database Schema
-- Compatible with Neon PostgreSQL + Clerk Authentication
-- Run this in Neon SQL Editor

-- =====================================================
-- SALES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    invoice_number TEXT,
    customer_name TEXT,
    platform TEXT,
    product_name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    amount NUMERIC DEFAULT 0,
    gst_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    payment_method TEXT,
    notes TEXT,
    gst_percentage NUMERIC DEFAULT 18,
    gst_inclusive BOOLEAN DEFAULT false,
    cost_price NUMERIC DEFAULT 0,
    amount_received NUMERIC DEFAULT 0,
    platform_commission NUMERIC DEFAULT 0,
    profit_amount NUMERIC DEFAULT 0,
    selling_expense_amount NUMERIC DEFAULT 0,
    selling_expense_category TEXT,
    selling_expense_notes TEXT,
    order_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sales_user_id_idx ON sales(user_id);
CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(date);
CREATE INDEX IF NOT EXISTS sales_platform_idx ON sales(platform);

-- =====================================================
-- PURCHASES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    invoice_number TEXT,
    supplier_name TEXT,
    category TEXT,
    item_name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    amount NUMERIC DEFAULT 0,
    gst_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    payment_method TEXT,
    notes TEXT,
    gst_percentage NUMERIC DEFAULT 18,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON purchases(user_id);
CREATE INDEX IF NOT EXISTS purchases_date_idx ON purchases(date);
CREATE INDEX IF NOT EXISTS purchases_category_idx ON purchases(category);

-- =====================================================
-- EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    category TEXT,
    description TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);

-- =====================================================
-- ASSETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    purchase_date DATE NOT NULL,
    purchase_price NUMERIC DEFAULT 0,
    gst_percentage NUMERIC DEFAULT 18,
    current_value NUMERIC DEFAULT 0,
    depreciation_method TEXT DEFAULT 'straight_line',
    depreciation_rate NUMERIC DEFAULT 10,
    useful_life_years INTEGER DEFAULT 5,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assets_user_id_idx ON assets(user_id);
CREATE INDEX IF NOT EXISTS assets_category_idx ON assets(category);

-- =====================================================
-- INVENTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    sku TEXT,
    category TEXT,
    unit_of_measure TEXT DEFAULT 'pcs',
    current_stock NUMERIC DEFAULT 0,
    reorder_level NUMERIC DEFAULT 0,
    unit_cost NUMERIC DEFAULT 0,
    selling_price NUMERIC DEFAULT 0,
    gst_percentage NUMERIC DEFAULT 18,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inventory_user_id_idx ON inventory(user_id);
CREATE INDEX IF NOT EXISTS inventory_product_name_idx ON inventory(product_name);
CREATE INDEX IF NOT EXISTS inventory_sku_idx ON inventory(sku);

-- =====================================================
-- STOCK MOVEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stock_movements_user_id_idx ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS stock_movements_inventory_id_idx ON stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS stock_movements_created_at_idx ON stock_movements(created_at);

-- =====================================================
-- SALES RETURNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sales_returns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    return_date DATE NOT NULL,
    order_id TEXT,
    product_name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    return_amount NUMERIC DEFAULT 0,
    return_shipping_fee NUMERIC DEFAULT 0,
    refund_amount NUMERIC DEFAULT 0,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sales_returns_user_id_idx ON sales_returns(user_id);
CREATE INDEX IF NOT EXISTS sales_returns_sale_id_idx ON sales_returns(sale_id);
CREATE INDEX IF NOT EXISTS sales_returns_date_idx ON sales_returns(return_date);

-- =====================================================
-- PURCHASE RETURNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_returns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    return_date DATE NOT NULL,
    supplier_name TEXT,
    item_name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    return_amount NUMERIC DEFAULT 0,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS purchase_returns_user_id_idx ON purchase_returns(user_id);
CREATE INDEX IF NOT EXISTS purchase_returns_purchase_id_idx ON purchase_returns(purchase_id);
CREATE INDEX IF NOT EXISTS purchase_returns_date_idx ON purchase_returns(return_date);

-- =====================================================
-- EXPENSE CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expense_categories_user_id_idx ON expense_categories(user_id);

-- Insert default expense categories
INSERT INTO expense_categories (name, description, is_default) VALUES
    ('Shipping', 'Shipping and delivery charges', true),
    ('Platform Commission', 'Marketplace commission fees', true),
    ('Packaging', 'Packaging materials and costs', true),
    ('Marketing', 'Advertising and promotion', true),
    ('Rent', 'Office or warehouse rent', true),
    ('Utilities', 'Electricity, water, internet', true),
    ('Salaries', 'Employee wages and salaries', true),
    ('Other', 'Miscellaneous expenses', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- AUTO UPDATE TIMESTAMP TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_returns_updated_at BEFORE UPDATE ON sales_returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_returns_updated_at BEFORE UPDATE ON purchase_returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
