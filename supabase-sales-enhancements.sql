-- Sales Enhancements: GST Inclusive, Platform Commission, Cost Tracking, Returns

-- Drop existing view before altering table
DROP VIEW IF EXISTS sales_profit_analysis;

-- Add new columns to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS gst_inclusive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_received NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_commission NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_amount NUMERIC DEFAULT 0;

-- Create sales_returns table
CREATE TABLE IF NOT EXISTS public.sales_returns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    invoice_number TEXT,
    customer_name TEXT,
    platform TEXT,
    product_name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    gst_percentage NUMERIC DEFAULT 18,
    amount NUMERIC DEFAULT 0,
    gst_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    refund_amount NUMERIC DEFAULT 0,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for sales returns
ALTER TABLE public.sales_returns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sales returns" ON public.sales_returns;
DROP POLICY IF EXISTS "Users can insert their own sales returns" ON public.sales_returns;
DROP POLICY IF EXISTS "Users can update their own sales returns" ON public.sales_returns;
DROP POLICY IF EXISTS "Users can delete their own sales returns" ON public.sales_returns;

-- Create policies for sales returns
CREATE POLICY "Users can view their own sales returns" ON public.sales_returns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales returns" ON public.sales_returns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales returns" ON public.sales_returns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales returns" ON public.sales_returns
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for sales returns
CREATE INDEX IF NOT EXISTS sales_returns_user_id_idx ON public.sales_returns(user_id);
CREATE INDEX IF NOT EXISTS sales_returns_date_idx ON public.sales_returns(date);
CREATE INDEX IF NOT EXISTS sales_returns_sale_id_idx ON public.sales_returns(sale_id);

-- Create trigger for sales returns
DROP TRIGGER IF EXISTS update_sales_returns_updated_at ON public.sales_returns;
CREATE TRIGGER update_sales_returns_updated_at BEFORE UPDATE ON public.sales_returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create purchase_returns table
CREATE TABLE IF NOT EXISTS public.purchase_returns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    invoice_number TEXT,
    supplier_name TEXT,
    category TEXT,
    item_name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    gst_percentage NUMERIC DEFAULT 18,
    amount NUMERIC DEFAULT 0,
    gst_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    refund_amount NUMERIC DEFAULT 0,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for purchase returns
ALTER TABLE public.purchase_returns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own purchase returns" ON public.purchase_returns;
DROP POLICY IF EXISTS "Users can insert their own purchase returns" ON public.purchase_returns;
DROP POLICY IF EXISTS "Users can update their own purchase returns" ON public.purchase_returns;
DROP POLICY IF EXISTS "Users can delete their own purchase returns" ON public.purchase_returns;

-- Create policies for purchase returns
CREATE POLICY "Users can view their own purchase returns" ON public.purchase_returns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase returns" ON public.purchase_returns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase returns" ON public.purchase_returns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase returns" ON public.purchase_returns
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for purchase returns
CREATE INDEX IF NOT EXISTS purchase_returns_user_id_idx ON public.purchase_returns(user_id);
CREATE INDEX IF NOT EXISTS purchase_returns_date_idx ON public.purchase_returns(date);
CREATE INDEX IF NOT EXISTS purchase_returns_purchase_id_idx ON public.purchase_returns(purchase_id);

-- Create trigger for purchase returns
DROP TRIGGER IF EXISTS update_purchase_returns_updated_at ON public.purchase_returns;
CREATE TRIGGER update_purchase_returns_updated_at BEFORE UPDATE ON public.purchase_returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing sales records to have default values
UPDATE public.sales 
SET 
    gst_inclusive = false,
    cost_price = 0,
    amount_received = total_amount,
    platform_commission = 0,
    profit_amount = 0
WHERE gst_inclusive IS NULL;

-- View for sales with profit analysis (including selling expenses)
CREATE OR REPLACE VIEW sales_profit_analysis AS
SELECT 
    s.*,
    (s.amount_received - s.cost_price) as gross_profit,
    (s.amount_received - s.cost_price - COALESCE(s.selling_expense_amount, 0)) as net_profit,
    CASE 
        WHEN s.cost_price > 0 THEN ((s.amount_received - s.cost_price - COALESCE(s.selling_expense_amount, 0)) / s.cost_price * 100)
        ELSE 0 
    END as profit_margin_percentage
FROM public.sales s;
