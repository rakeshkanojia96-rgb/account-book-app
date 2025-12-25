-- Account Book App - Supabase Database Schema
-- This file contains all the SQL commands to set up your database

-- Enable Row Level Security (RLS) on all tables
-- This ensures users can only access their own data

-- =====================================================
-- SALES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own sales" ON public.sales
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales" ON public.sales
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales" ON public.sales
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales" ON public.sales
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS sales_user_id_idx ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS sales_date_idx ON public.sales(date);
CREATE INDEX IF NOT EXISTS sales_platform_idx ON public.sales(platform);

-- =====================================================
-- PURCHASES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases" ON public.purchases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchases" ON public.purchases
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS purchases_date_idx ON public.purchases(date);
CREATE INDEX IF NOT EXISTS purchases_category_idx ON public.purchases(category);

-- =====================================================
-- EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    category TEXT,
    description TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON public.expenses(date);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON public.expenses(category);

-- =====================================================
-- ASSETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    asset_name TEXT NOT NULL,
    category TEXT,
    purchase_date DATE NOT NULL,
    purchase_price NUMERIC DEFAULT 0,
    depreciation_method TEXT DEFAULT 'Straight Line',
    depreciation_rate NUMERIC DEFAULT 10,
    useful_life_years INTEGER DEFAULT 5,
    current_value NUMERIC DEFAULT 0,
    accumulated_depreciation NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own assets" ON public.assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets" ON public.assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets" ON public.assets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets" ON public.assets
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS assets_user_id_idx ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS assets_purchase_date_idx ON public.assets(purchase_date);
CREATE INDEX IF NOT EXISTS assets_category_idx ON public.assets(category);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR REPORTING (Optional but recommended)
-- =====================================================

-- View for monthly sales summary
CREATE OR REPLACE VIEW monthly_sales_summary AS
SELECT 
    user_id,
    DATE_TRUNC('month', date) as month,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_sales,
    SUM(gst_amount) as total_gst
FROM public.sales
GROUP BY user_id, DATE_TRUNC('month', date);

-- View for category-wise expenses
CREATE OR REPLACE VIEW category_wise_expenses AS
SELECT 
    user_id,
    category,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount
FROM public.expenses
GROUP BY user_id, category;
